// =============================================================
// PRANCHETO.IA - ASSISTENTE COM ACAO NO CRM
//
// Separada de chat-ai de proposito. Aquela atende o Super Admin e
// fala de codigo e modulos; esta atende o cliente e age no CRM dele.
// Compartilhar as duas em uma so era o que fazia o Chat do cliente
// responder como assistente de desenvolvimento.
//
// Tudo aqui roda com o JWT de quem conversa, nunca com service_role:
// o RLS do CRM continua sendo a barreira, e o assistente nao alcanca
// nada que a pessoa ja nao alcancasse pela tela.
//
// TRES ENTRADAS:
//   { conversationId, mensagem }          conversa normal
//   { conversationId, acaoId, aprovada }  resposta ao cartao de confirmacao
//   { modo: 'diagnostico' }               checagem sem gastar token
//
// SEM CREDITO NA OPENAI: a chamada volta 429/insufficient_quota e a
// resposta sai com codigo 'sem_credito'. Nada mais no caminho depende
// disso — ferramentas, permissoes, confirmacao e persistencia sao
// exercitaveis pelo modo diagnostico. Quando houver credito, funciona
// sem tocar em codigo.
// =============================================================

/// <reference path="../deno-ambient.d.ts" />

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import {
  FERRAMENTAS,
  comoToolsOpenAI,
  ferramentaPorNome,
  ferramentasPermitidas,
  temPermissao,
  type ContextoFerramenta,
} from '../_shared/ferramentas-crm.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Teto de idas e voltas com o modelo num unico turno. O modelo pode
// encadear ferramentas (buscar -> detalhar -> registrar); sem teto,
// um loop de raciocinio vira conta aberta.
const MAX_RODADAS = 5;
const MAX_TOKENS = 1000;

interface ConfiguracaoProvedor {
  provedor: 'gemini' | 'openai';
  chave: string;
  url: string;
  modelo: string;
}

const obterConfiguracaoProvedor = (modeloConversa?: string | null): ConfiguracaoProvedor => {
  const chaveGemini = Deno.env.get('GEMINI_API_KEY') || Deno.env.get('GOOGLE_API_KEY') || '';
  const chaveOpenAI = Deno.env.get('OPENAI_API_KEY') || '';

  // Se houver chave do Gemini configurada (ou prioritária), usa Google Gemini
  if (chaveGemini) {
    const baseUrl = (Deno.env.get('GEMINI_BASE_URL') || 'https://generativelanguage.googleapis.com/v1beta/openai').replace(/\/+$/, '');
    const url = baseUrl.endsWith('/chat/completions') ? baseUrl : `${baseUrl}/chat/completions`;
    // Modelo padrão ultra-rápido: gemini-2.5-flash
    const modeloEnv = Deno.env.get('GEMINI_MODEL');
    const modeloValidoConversa = modeloConversa && !modeloConversa.startsWith('gpt-') ? modeloConversa : null;
    const modelo = modeloEnv || modeloValidoConversa || 'gemini-2.5-flash';

    return { provedor: 'gemini', chave: chaveGemini, url, modelo };
  }

  // Fallback para OpenAI caso GEMINI_API_KEY não esteja configurada
  const baseUrl = (Deno.env.get('OPENAI_BASE_URL') || Deno.env.get('OPENAI_ENDPOINT') || 'https://api.openai.com/v1').replace(/\/+$/, '');
  const url = baseUrl.endsWith('/chat/completions') ? baseUrl : `${baseUrl}/chat/completions`;
  const modeloEnv = Deno.env.get('OPENAI_MODEL');
  const modeloValidoConversa = modeloConversa && !modeloConversa.startsWith('gemini-') ? modeloConversa : null;
  const modelo = modeloEnv || modeloValidoConversa || 'gpt-4o-mini';

  return { provedor: 'openai', chave: chaveOpenAI, url, modelo };
};

const responder = (corpo: unknown, status = 200) =>
  new Response(JSON.stringify(corpo), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const promptSistema = (usuario: { nome: string }, hoje: string) => `
Voce e o assistente do Prancheto.IA, um CRM. Fala com ${usuario.nome}, em portugues do Brasil.
Hoje e ${hoje}.

Voce nao apenas responde: voce age no CRM pelas ferramentas disponiveis.

COMO TRABALHAR
- Para agir sobre um contato voce precisa do id dele. Nunca invente um id:
  chame buscar_contatos primeiro e use o id que voltar.
- Se a busca trouxer mais de um contato plausivel, pergunte qual antes de agir.
- Para perguntas sobre o estado geral da carteira, prefira resumo_funil a listar tudo.
- Nao invente dados. Se o usuario nao disse o e-mail, nao preencha o e-mail.
- Depois de agir, diga em uma frase o que foi feito. Sem repetir o JSON.

CONFIRMACAO
Algumas ferramentas exigem confirmacao do usuario. Voce nao precisa pedir
essa confirmacao no texto: o sistema mostra um cartao com Confirmar e
Descartar, e so executa depois. Chame a ferramenta normalmente e diga o que
esta propondo.

LIMITES
- Voce alcanca apenas o que o cargo do usuario alcanca. Se uma ferramenta
  faltar, diga que o cargo dele nao permite aquilo, e sugira falar com o
  administrador da organizacao.
- Se uma ferramenta devolver erro, explique o erro em portugues claro. Nao
  tente a mesma coisa de novo sem mudar nada.
`.trim();

/** Reconstroi a conversa no formato compativel a partir de ai_messages. */
const montarMensagens = (historico: any[]) => {
  const mensagens: any[] = [];
  for (const msg of historico) {
    if (msg.remetente === 'user') {
      mensagens.push({ role: 'user', content: msg.conteudo });
    } else if (msg.remetente === 'assistant') {
      const toolCalls = msg.metadata?.tool_calls;
      mensagens.push({
        role: 'assistant',
        content: msg.conteudo || null,
        ...(Array.isArray(toolCalls) && toolCalls.length ? { tool_calls: toolCalls } : {}),
      });
    } else if (msg.remetente === 'tool') {
      mensagens.push({
        role: 'tool',
        tool_call_id: msg.metadata?.tool_call_id,
        content: msg.conteudo,
      });
    }
  }
  return mensagens;
};

const chamarLLM = async (config: ConfiguracaoProvedor, corpo: unknown) => {
  const resposta = await fetch(config.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.chave}` },
    body: JSON.stringify(corpo),
  });

  if (resposta.ok) return await resposta.json();

  const texto = await resposta.text();
  let detalhe: any = {};
  try { detalhe = JSON.parse(texto); } catch { /* corpo nao-JSON: fica o texto cru */ }

  const status = resposta.status;
  const codigoErro = detalhe?.error?.code ?? detalhe?.error?.status ?? '';
  const mensagemErro = detalhe?.error?.message ?? texto;

  // Deteccao de cota/saldo esgotado (OpenAI 429 / insufficient_quota ou Gemini 429 / RESOURCE_EXHAUSTED)
  const semCredito =
    status === 429 ||
    codigoErro === 'insufficient_quota' ||
    codigoErro === 'RESOURCE_EXHAUSTED' ||
    mensagemErro.toLowerCase().includes('quota') ||
    mensagemErro.toLowerCase().includes('exhausted');

  const nomeProvedor = config.provedor === 'gemini' ? 'Google Gemini' : 'OpenAI';
  const erro: any = new Error(
    semCredito
      ? `A cota da API do ${nomeProvedor} está esgotada ou sem saldo disponível no momento.`
      : `Erro no ${nomeProvedor} (${status}): ${mensagemErro}`,
  );
  erro.codigo = semCredito ? 'sem_credito' : `erro_${config.provedor}`;
  throw erro;
};

/** Grava a execucao na trilha de auditoria. Falha aqui nao derruba a acao. */
const auditar = async (
  ctx: ContextoFerramenta,
  ferramenta: string,
  argumentos: unknown,
  resultado: any,
) => {
  try {
    await ctx.supabase.from('audit_logs').insert({
      tenant_id: ctx.usuario.tenant_id,
      user_id: ctx.usuario.id,
      acao: `assistente_ia.${ferramenta}`,
      recurso: 'crm',
      recurso_id: resultado?.id ?? resultado?.contato?.id ?? null,
      descricao: `Assistente de IA executou ${ferramenta}.`,
      dados_novos: { argumentos, resultado },
    });
  } catch (_) { /* auditoria e registro, nao pre-requisito */ }
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const corpo = await req.json();
    const chaveOpenAI = Deno.env.get('OPENAI_API_KEY') ?? '';

    const cabecalhoAuth = req.headers.get('Authorization') ?? '';
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: cabecalhoAuth } } },
    );

    // --- Quem esta falando, e o que o cargo dele alcanca ---
    // O token vai explicito: aqui nao ha sessao guardada, e getUser()
    // sem argumento procura numa que nunca existiu.
    const { data: auth } = await supabase.auth.getUser(cabecalhoAuth.replace(/^Bearer\s+/i, ''));
    if (!auth?.user) return responder({ erro: 'Sessao invalida.' }, 401);

    const { data: perfil, error: erroPerfil } = await supabase
      .from('users')
      .select('id, nome, tenant_id, cargo, cargo_id')
      .eq('id', auth.user.id)
      .maybeSingle();
    if (erroPerfil || !perfil) return responder({ erro: 'Perfil de usuario nao encontrado.' }, 404);

    let permissoes: string[] | null = null;
    if (perfil.cargo_id) {
      const { data: cargo } = await supabase
        .from('org_cargos').select('permissoes').eq('id', perfil.cargo_id).maybeSingle();
      permissoes = Array.isArray(cargo?.permissoes) ? cargo!.permissoes : null;
    }

    const ctx: ContextoFerramenta = {
      supabase,
      usuario: { id: perfil.id, tenant_id: perfil.tenant_id, nome: perfil.nome },
      permissoes,
    };

    // --- Modo diagnostico: valida o caminho todo sem chamar a IA ---
    if (corpo.modo === 'diagnostico') {
      const config = obterConfiguracaoProvedor(null);
      const chaveGemini = Deno.env.get('GEMINI_API_KEY') || Deno.env.get('GOOGLE_API_KEY') || '';
      return responder({
        sucesso: true,
        provedor: config.provedor,
        modelo: config.modelo,
        chave_configurada: config.chave.length > 0,
        chave_gemini_configurada: chaveGemini.length > 0,
        chave_openai_configurada: chaveOpenAI.length > 0,
        usuario: { nome: perfil.nome, cargo: perfil.cargo, tem_cargo_organizacional: !!perfil.cargo_id },
        ferramentas: FERRAMENTAS.map((f) => ({
          nome: f.nome,
          permissao: f.permissao,
          confirmar: f.confirmar,
          disponivel: temPermissao(permissoes, f.permissao),
        })),
      });
    }

    // --- Conversa ---
    const { data: conversa, error: erroConversa } = await supabase
      .from('ai_conversations')
      .select('*')
      .eq('id', corpo.conversationId)
      .eq('status', 'ativa')
      .maybeSingle();
    if (erroConversa || !conversa) return responder({ erro: 'Conversa nao encontrada ou sem acesso.' }, 404);

    const disponiveis = ferramentasPermitidas(permissoes);
    let tokensDoTurno = 0;
    // Marca se este request ja gravou algo no CRM. Decide o que fazer
    // quando a OpenAI falha depois: erro puro apagaria da tela uma
    // acao que aconteceu de verdade.
    let houveEfeito = false;

    const gravarMensagem = async (linha: Record<string, unknown>) => {
      const { data, error } = await supabase
        .from('ai_messages')
        .insert({ conversation_id: conversa.id, ...linha })
        .select('id, remetente, conteudo, metadata, criado_em')
        .single();
      if (error) throw error;
      return data;
    };

    /** Executa a ferramenta e devolve o texto que volta ao modelo. */
    const executarFerramenta = async (nome: string, argumentos: any) => {
      const ferramenta = ferramentaPorNome(nome);
      if (!ferramenta) return { ok: false, conteudo: `Ferramenta desconhecida: ${nome}.` };
      if (!temPermissao(permissoes, ferramenta.permissao)) {
        return { ok: false, conteudo: `O cargo do usuario nao permite "${nome}".` };
      }
      try {
        const resultado = await ferramenta.executar(argumentos, ctx);
        if (ferramenta.confirmar || ferramenta.permissao !== 'crm.ver') {
          await auditar(ctx, nome, argumentos, resultado);
        }
        return { ok: true, conteudo: JSON.stringify(resultado), resultado };
      } catch (e: any) {
        return { ok: false, conteudo: `Erro ao executar ${nome}: ${e.message}` };
      }
    };

    const pendentesDaConversa = async () => {
      const { data } = await supabase
        .from('ai_acoes')
        .select('id, tool_call_id, ferramenta, argumentos, resumo, status, criado_em')
        .eq('conversation_id', conversa.id)
        .eq('status', 'pendente')
        .order('criado_em', { ascending: true });
      return data ?? [];
    };

    // =========================================================
    // ENTRADA 1: resposta a um cartao de confirmacao
    // =========================================================
    if (corpo.acaoId) {
      const { data: acao, error: erroAcao } = await supabase
        .from('ai_acoes').select('*').eq('id', corpo.acaoId).maybeSingle();
      if (erroAcao || !acao) return responder({ erro: 'Acao nao encontrada.' }, 404);
      if (acao.status !== 'pendente') return responder({ erro: 'Esta acao ja foi resolvida.' }, 409);

      let conteudoTool: string;
      let novoStatus: string;

      if (corpo.aprovada === false) {
        conteudoTool = JSON.stringify({ recusada: true, motivo: 'O usuario descartou a acao.' });
        novoStatus = 'recusada';
        await supabase.from('ai_acoes')
          .update({ status: novoStatus, resolvido_em: new Date().toISOString() })
          .eq('id', acao.id);
      } else {
        const saida = await executarFerramenta(acao.ferramenta, acao.argumentos);
        conteudoTool = saida.conteudo;
        novoStatus = saida.ok ? 'executada' : 'falhou';
        houveEfeito = saida.ok;
        await supabase.from('ai_acoes').update({
          status: novoStatus,
          resultado: saida.ok ? (saida as any).resultado : null,
          erro: saida.ok ? null : saida.conteudo,
          resolvido_em: new Date().toISOString(),
        }).eq('id', acao.id);
      }

      await gravarMensagem({
        remetente: 'tool',
        conteudo: conteudoTool,
        metadata: { tool_call_id: acao.tool_call_id, ferramenta: acao.ferramenta, acao_id: acao.id },
      });

      // Enquanto sobrar cartao aberto, a conversa tem chamada de
      // ferramenta sem resposta — e a OpenAI recusa o payload assim.
      const aindaPendentes = await pendentesDaConversa();
      if (aindaPendentes.length > 0) {
        return responder({ sucesso: true, acao: { id: acao.id, status: novoStatus }, acoes_pendentes: aindaPendentes, resposta_ia: null });
      }
    }

    // =========================================================
    // ENTRADA 2: mensagem nova
    // =========================================================
    if (corpo.mensagem) {
      // Cartao aberto que o usuario ignorou vira recusa: sem isso a
      // conversa fica com chamada de ferramenta sem resposta e trava.
      for (const pendente of await pendentesDaConversa()) {
        await supabase.from('ai_acoes')
          .update({ status: 'recusada', resolvido_em: new Date().toISOString() })
          .eq('id', pendente.id);
        await gravarMensagem({
          remetente: 'tool',
          conteudo: JSON.stringify({ recusada: true, motivo: 'O usuario seguiu a conversa sem confirmar.' }),
          metadata: { tool_call_id: pendente.tool_call_id, ferramenta: pendente.ferramenta, acao_id: pendente.id },
        });
      }
      await gravarMensagem({ remetente: 'user', conteudo: corpo.mensagem });
    } else if (!corpo.acaoId) {
      return responder({ erro: 'Envie uma mensagem ou a resposta de uma acao.' }, 400);
    }

    // =========================================================
    // LACO COM O MODELO
    // =========================================================
    const hoje = new Date().toLocaleDateString('pt-BR', { dateStyle: 'long' });
    let respostaFinal: any = null;
    let novasPendentes: any[] = [];
    let aviso: { mensagem: string; codigo: string } | null = null;
    const configIA = obterConfiguracaoProvedor(conversa.modelo);

    try {
    // Dentro do try de proposito: a falta da chave e mais um motivo
    // de o assistente nao comentar o resultado, e nao motivo para
    // esconder a acao que ja foi gravada logo acima.
    if (!configIA.chave) {
      const semChave: any = new Error(
        'Nenhuma chave de IA configurada. Configure GEMINI_API_KEY (ou OPENAI_API_KEY) nos secrets do Supabase.'
      );
      semChave.codigo = 'sem_chave';
      throw semChave;
    }

    for (let rodada = 0; rodada < MAX_RODADAS; rodada++) {
      // Janela deslizante de contexto: busca as 12 mensagens mais recentes para acelerar a resposta do modelo
      const { data: ultimasMensagens } = await supabase
        .from('ai_messages')
        .select('remetente, conteudo, metadata')
        .eq('conversation_id', conversa.id)
        .order('criado_em', { ascending: false })
        .limit(12);

      const historico = (ultimasMensagens || []).reverse();

      const resposta = await chamarLLM(configIA, {
        model: configIA.modelo,
        messages: [
          { role: 'system', content: promptSistema(ctx.usuario, hoje) },
          ...montarMensagens(historico),
        ],
        tools: comoToolsOpenAI(disponiveis),
        tool_choice: 'auto',
        max_tokens: MAX_TOKENS,
        temperature: 0.3,
      });

      const escolha = resposta.choices?.[0];
      const mensagem = escolha?.message ?? {};
      tokensDoTurno += resposta.usage?.total_tokens ?? 0;

      const toolCalls = mensagem.tool_calls ?? [];
      const gravada = await gravarMensagem({
        remetente: 'assistant',
        conteudo: mensagem.content ?? '',
        tokens_usados: resposta.usage?.completion_tokens ?? 0,
        metadata: {
          model: resposta.model,
          finish_reason: escolha?.finish_reason,
          ...(toolCalls.length ? { tool_calls: toolCalls } : {}),
        },
      });

      if (toolCalls.length === 0) { respostaFinal = gravada; break; }

      // Diretas executam agora; as que pedem confirmacao viram cartao.
      for (const chamada of toolCalls) {
        const nome = chamada.function?.name;
        let argumentos: any = {};
        try { argumentos = JSON.parse(chamada.function?.arguments || '{}'); } catch { /* args invalidos caem no erro abaixo */ }

        const ferramenta = ferramentaPorNome(nome);

        if (ferramenta?.confirmar && temPermissao(permissoes, ferramenta.permissao)) {
          const { data: acao } = await supabase.from('ai_acoes').insert({
            conversation_id: conversa.id,
            tenant_id: ctx.usuario.tenant_id,
            user_id: ctx.usuario.id,
            tool_call_id: chamada.id,
            ferramenta: nome,
            argumentos,
            resumo: await ferramenta.resumo(argumentos, ctx),
          }).select('id, tool_call_id, ferramenta, argumentos, resumo, status, criado_em').single();
          if (acao) novasPendentes.push(acao);
          continue;
        }

        const saida = await executarFerramenta(nome, argumentos);
        await gravarMensagem({
          remetente: 'tool',
          conteudo: saida.conteudo,
          metadata: { tool_call_id: chamada.id, ferramenta: nome },
        });
      }

      // Com cartao aberto, o turno para aqui: o proximo passo depende
      // de uma decisao humana, e o texto ja gravado explica a proposta.
      if (novasPendentes.length > 0) { respostaFinal = gravada; break; }
    }
    } catch (falhaIA: any) {
      // Sem efeito no CRM, o erro e o resultado do turno. Com efeito,
      // a acao ja aconteceu: informar so a falha faria o usuario achar
      // que nada foi gravado, e repetir o pedido.
      if (!houveEfeito) throw falhaIA;
      aviso = { mensagem: falhaIA.message, codigo: falhaIA.codigo ?? (configIA.provedor === 'gemini' ? 'erro_gemini' : 'erro_openai') };
    }

    if (tokensDoTurno > 0) {
      await supabase.from('ai_conversations').update({
        total_tokens: (conversa.total_tokens || 0) + tokensDoTurno,
        atualizado_em: new Date().toISOString(),
      }).eq('id', conversa.id);
    }

    const { data: mensagensFinais } = await supabase
      .from('ai_messages')
      .select('id, remetente, conteudo, metadata, criado_em')
      .eq('conversation_id', conversa.id)
      .order('criado_em', { ascending: true });

    return responder({
      sucesso: true,
      mensagens: mensagensFinais ?? [],
      resposta_ia: respostaFinal,
      acoes_pendentes: novasPendentes,
      aviso,
      uso: { tokens_total: tokensDoTurno },
    });

  } catch (error: any) {
    return responder({ erro: error.message, codigo: error.codigo ?? 'erro_interno' });
  }
});
