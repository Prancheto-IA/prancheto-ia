// =============================================================
// PRANCHETO.IA - FERRAMENTAS DO ASSISTENTE NO CRM
//
// Catalogo do que o assistente sabe fazer. Fica separado da Edge
// Function de proposito: aqui nao ha nada da OpenAI, so o contrato
// (nome, parametros, permissao) e a execucao contra o Supabase.
// Isso e o que permite exercitar a camada de acao sem gastar token —
// ver o modo 'diagnostico' em crm-assistente/index.ts.
//
// TRES REGRAS QUE VALEM PARA TODA FERRAMENTA NOVA:
//
// 1. Executa com o JWT de quem conversa, nunca com service_role. O
//    RLS e as policies do CRM continuam sendo a barreira real; a
//    checagem de permissao aqui e para o assistente saber o que
//    oferecer, e para a recusa sair legivel em vez de erro de banco.
//
// 2. 'confirmar: true' para o que muda dado existente. Criar um lead
//    novo e reversivel e barato; mover no funil e converter em cliente
//    mexem em registro que ja tem historia, e disparam gatilho.
//
// 3. 'resumo' e escrito aqui, no servidor, a partir dos argumentos
//    reais. O cartao de confirmacao precisa dizer o que vai acontecer
//    de fato, e nao o que o modelo diz que vai acontecer.
// =============================================================

import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

export const ETAPAS_FUNIL = [
  'lead', 'qualificado', 'proposta', 'negociacao', 'fechado', 'perdido',
] as const;

export const TIPOS_INTERACAO = [
  'nota', 'ligacao', 'email', 'reuniao', 'whatsapp', 'outro',
] as const;

const ORIGENS = [
  'manual', 'site', 'formulario', 'anuncio', 'indicacao', 'linkedin', 'email', 'outro',
] as const;

// Teto de linhas por consulta. Existe para o contexto do modelo, nao
// para o banco: devolver 500 contatos gasta token e piora a resposta.
const LIMITE_PADRAO = 20;
const LIMITE_MAXIMO = 50;

export interface ContextoFerramenta {
  supabase: SupabaseClient;
  usuario: { id: string; tenant_id: string | null; nome: string };
  /** org_cargos.permissoes. null = usuario sem cargo organizacional. */
  permissoes: string[] | null;
}

export interface Ferramenta {
  nome: string;
  descricao: string;
  /** Slug de org_cargos.permissoes exigido, ou null para leitura livre. */
  permissao: string | null;
  /** true = propoe e espera o usuario confirmar antes de gravar. */
  confirmar: boolean;
  parametros: Record<string, unknown>;
  /**
   * Frase do cartao de confirmacao. Recebe o contexto porque quem le o
   * cartao precisa do nome do contato, e o modelo so passa o id — pedir
   * para uma pessoa aprovar "mover o contato c8000000-0000-4000..." e
   * pedir aprovacao no escuro.
   */
  resumo: (args: Record<string, any>, ctx: ContextoFerramenta) => Promise<string>;
  executar: (args: Record<string, any>, ctx: ContextoFerramenta) => Promise<unknown>;
}

/**
 * Espelha temPermissao() do front-end e tem_permissao() do banco.
 * Sem lista, libera: usuario de signup direto nao tem cargo
 * organizacional, e negar aqui esconderia o assistente de quem sempre
 * teve acesso ao CRM. O RLS continua valendo por baixo.
 */
export const temPermissao = (permissoes: string[] | null, slug: string | null): boolean => {
  if (!slug) return true;
  if (!Array.isArray(permissoes)) return true;
  return permissoes.includes('*') || permissoes.includes(slug);
};

const texto = (descricao: string) => ({ type: 'string', description: descricao });

const naoEncontrado = (id: string) =>
  new Error(`Contato ${id} nao encontrado, ou fora do seu alcance de visualizacao.`);

/** Colunas devolvidas ao modelo. Enxutas de proposito: cada campo extra e token gasto em toda resposta. */
const COLUNAS_RESUMO = 'id, nome, email, telefone, empresa, cargo, status_funil, tipo_registro, valor_estimado, score, atualizado_em';

/**
 * Nome do contato para o cartao de confirmacao.
 *
 * Nao usa buscarContatoOuFalhar: montar o resumo nao pode falhar por
 * um contato inalcancavel — quem barra isso e a execucao. Sem nome,
 * cai para o id, que e feio mas honesto.
 */
const nomeDoContato = async (ctx: ContextoFerramenta, id: string) => {
  const { data } = await ctx.supabase
    .from('crm_contatos').select('nome, empresa').eq('id', id).maybeSingle();
  if (!data) return `contato ${id}`;
  return data.empresa ? `${data.nome} (${data.empresa})` : data.nome;
};

const buscarContatoOuFalhar = async (ctx: ContextoFerramenta, id: string) => {
  const { data, error } = await ctx.supabase
    .from('crm_contatos')
    .select(COLUNAS_RESUMO)
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw naoEncontrado(id);
  return data;
};

export const FERRAMENTAS: Ferramenta[] = [
  // ---------------------------------------------------------
  // LEITURA
  // ---------------------------------------------------------
  {
    nome: 'buscar_contatos',
    descricao:
      'Procura leads e clientes do CRM por nome, empresa ou e-mail, com filtro opcional de etapa do funil. ' +
      'Use antes de qualquer acao que precise do id de um contato.',
    permissao: 'crm.ver',
    confirmar: false,
    parametros: {
      type: 'object',
      properties: {
        busca: texto('Trecho do nome, empresa ou e-mail. Omita para listar os mais recentes.'),
        tipo_registro: { type: 'string', enum: ['lead', 'cliente'], description: 'Restringe a leads ou a clientes.' },
        status_funil: { type: 'string', enum: ETAPAS_FUNIL, description: 'Etapa do funil.' },
        limite: { type: 'integer', description: `Quantos devolver (1 a ${LIMITE_MAXIMO}). Padrao ${LIMITE_PADRAO}.` },
      },
      required: [],
      additionalProperties: false,
    },
    resumo: async (a) => `Buscar contatos${a.busca ? ` com "${a.busca}"` : ''}`,
    executar: async (args, ctx) => {
      const limite = Math.min(Math.max(Number(args.limite) || LIMITE_PADRAO, 1), LIMITE_MAXIMO);
      let q = ctx.supabase
        .from('crm_contatos')
        .select(COLUNAS_RESUMO)
        .order('atualizado_em', { ascending: false })
        .limit(limite);

      if (args.tipo_registro) q = q.eq('tipo_registro', args.tipo_registro);
      if (args.status_funil) q = q.eq('status_funil', args.status_funil);
      if (args.busca) {
        const termo = String(args.busca).replace(/[%,()]/g, ' ').trim();
        if (termo) q = q.or(`nome.ilike.%${termo}%,empresa.ilike.%${termo}%,email.ilike.%${termo}%`);
      }

      const { data, error } = await q;
      if (error) throw new Error(error.message);
      return { total: data?.length ?? 0, contatos: data ?? [] };
    },
  },

  {
    nome: 'detalhar_contato',
    descricao: 'Traz os dados completos de um contato e as ultimas interacoes registradas nele.',
    permissao: 'crm.ver',
    confirmar: false,
    parametros: {
      type: 'object',
      properties: { contato_id: texto('Id do contato, obtido em buscar_contatos.') },
      required: ['contato_id'],
      additionalProperties: false,
    },
    resumo: async (a, ctx) => `Ver detalhes de ${await nomeDoContato(ctx, a.contato_id)}`,
    executar: async (args, ctx) => {
      const { data: contato, error } = await ctx.supabase
        .from('crm_contatos')
        .select('*, responsavel:responsavel_id (id, nome, email)')
        .eq('id', args.contato_id)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!contato) throw naoEncontrado(args.contato_id);

      const { data: interacoes } = await ctx.supabase
        .from('crm_interacoes')
        .select('tipo, conteudo, criado_em')
        .eq('contato_id', args.contato_id)
        .order('criado_em', { ascending: false })
        .limit(10);

      return { contato, interacoes: interacoes ?? [] };
    },
  },

  {
    nome: 'resumo_funil',
    descricao:
      'Devolve, por etapa do funil, quantos leads existem e a soma do valor estimado. ' +
      'Use para perguntas sobre o estado geral da carteira, em vez de listar tudo.',
    permissao: 'crm.ver',
    confirmar: false,
    parametros: { type: 'object', properties: {}, required: [], additionalProperties: false },
    resumo: async () => 'Resumir o funil',
    executar: async (_args, ctx) => {
      const { data, error } = await ctx.supabase
        .from('crm_contatos')
        .select('status_funil, valor_estimado')
        .eq('tipo_registro', 'lead');
      if (error) throw new Error(error.message);

      const porEtapa = Object.fromEntries(
        ETAPAS_FUNIL.map((etapa) => [etapa, { quantidade: 0, valor_total: 0 }]),
      ) as Record<string, { quantidade: number; valor_total: number }>;

      for (const linha of data ?? []) {
        const etapa = porEtapa[linha.status_funil];
        if (!etapa) continue;
        etapa.quantidade += 1;
        etapa.valor_total += Number(linha.valor_estimado) || 0;
      }
      return { total_leads: data?.length ?? 0, por_etapa: porEtapa };
    },
  },

  // ---------------------------------------------------------
  // ESCRITA DIRETA
  // ---------------------------------------------------------
  {
    nome: 'criar_lead',
    descricao:
      'Cria um lead novo no CRM. Use apenas quando o usuario der o nome do contato. ' +
      'Nao invente e-mail, telefone ou empresa: deixe em branco o que ele nao disse.',
    permissao: 'crm.criar',
    confirmar: false,
    parametros: {
      type: 'object',
      properties: {
        nome: texto('Nome da pessoa. Obrigatorio.'),
        email: texto('E-mail, se informado.'),
        telefone: texto('Telefone, se informado.'),
        empresa: texto('Empresa, se informada.'),
        cargo: texto('Cargo da pessoa na empresa, se informado.'),
        origem: { type: 'string', enum: ORIGENS, description: 'De onde veio o lead. Padrao manual.' },
        valor_estimado: { type: 'number', description: 'Valor estimado do negocio, em reais.' },
        observacoes: texto('Contexto livre que o usuario tenha dado.'),
      },
      required: ['nome'],
      additionalProperties: false,
    },
    resumo: async (a) => `Criar o lead "${a.nome}"${a.empresa ? ` (${a.empresa})` : ''}`,
    executar: async (args, ctx) => {
      const nome = String(args.nome ?? '').trim();
      if (!nome) throw new Error('O lead precisa de um nome.');

      const { data, error } = await ctx.supabase
        .from('crm_contatos')
        .insert({
          // tenant_id e responsavel_id vao explicitos: a policy
          // crm_contatos_insert exige o tenant, e a coluna nao tem
          // default nem gatilho que a preencha.
          tenant_id: ctx.usuario.tenant_id,
          responsavel_id: ctx.usuario.id,
          nome,
          email: args.email ?? null,
          telefone: args.telefone ?? null,
          empresa: args.empresa ?? null,
          cargo: args.cargo ?? null,
          origem: args.origem ?? 'manual',
          valor_estimado: args.valor_estimado ?? null,
          observacoes: args.observacoes ?? null,
          tipo_registro: 'lead',
          status_funil: 'lead',
        })
        .select(COLUNAS_RESUMO)
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
  },

  {
    nome: 'registrar_interacao',
    descricao:
      'Anota no historico do contato algo que aconteceu: uma ligacao, um e-mail, uma reuniao, uma nota. ' +
      'Registrar interacao move o score do lead automaticamente.',
    permissao: 'crm.criar',
    confirmar: false,
    parametros: {
      type: 'object',
      properties: {
        contato_id: texto('Id do contato.'),
        tipo: { type: 'string', enum: TIPOS_INTERACAO, description: 'Natureza da interacao.' },
        conteudo: texto('O que aconteceu, em uma ou duas frases.'),
      },
      required: ['contato_id', 'tipo', 'conteudo'],
      additionalProperties: false,
    },
    resumo: async (a, ctx) => `Registrar ${a.tipo} em ${await nomeDoContato(ctx, a.contato_id)}`,
    executar: async (args, ctx) => {
      const contato = await buscarContatoOuFalhar(ctx, args.contato_id);
      const conteudo = String(args.conteudo ?? '').trim();
      if (!conteudo) throw new Error('A interacao precisa de conteudo.');

      const { data, error } = await ctx.supabase
        .from('crm_interacoes')
        .insert({
          contato_id: args.contato_id,
          tenant_id: ctx.usuario.tenant_id,
          criado_por: ctx.usuario.id,
          tipo: args.tipo,
          conteudo,
          metadata: { origem: 'assistente_ia' },
        })
        .select('id, tipo, conteudo, criado_em')
        .single();
      if (error) throw new Error(error.message);
      return { interacao: data, contato: { id: contato.id, nome: contato.nome } };
    },
  },

  // ---------------------------------------------------------
  // ESCRITA QUE PEDE CONFIRMACAO
  // ---------------------------------------------------------
  {
    nome: 'atualizar_contato',
    descricao:
      'Altera dados de um contato que ja existe. Envie apenas os campos que mudam. ' +
      'Para mudar a etapa do funil use mover_no_funil.',
    permissao: 'crm.editar',
    confirmar: true,
    parametros: {
      type: 'object',
      properties: {
        contato_id: texto('Id do contato.'),
        nome: texto('Novo nome.'),
        email: texto('Novo e-mail.'),
        telefone: texto('Novo telefone.'),
        empresa: texto('Nova empresa.'),
        cargo: texto('Novo cargo.'),
        valor_estimado: { type: 'number', description: 'Novo valor estimado, em reais.' },
        observacoes: texto('Novas observacoes. Substitui o texto anterior.'),
      },
      required: ['contato_id'],
      additionalProperties: false,
    },
    resumo: async (a, ctx) => {
      // Lista os campos e o valor novo: "alterar e-mail" nao da ao
      // usuario o que ele precisa para decidir. Alterar para o que?
      const mudancas = Object.entries(a)
        .filter(([campo]) => campo !== 'contato_id')
        .map(([campo, valor]) => `${campo} para "${valor}"`);
      const alvo = await nomeDoContato(ctx, a.contato_id);
      return mudancas.length
        ? `Alterar ${mudancas.join(', ')} em ${alvo}`
        : `Alterar dados de ${alvo}`;
    },
    executar: async (args, ctx) => {
      const { contato_id, ...campos } = args;
      const mudancas = Object.fromEntries(
        Object.entries(campos).filter(([, v]) => v !== undefined && v !== null),
      );
      if (Object.keys(mudancas).length === 0) throw new Error('Nenhum campo para alterar.');

      await buscarContatoOuFalhar(ctx, contato_id);

      const { data, error } = await ctx.supabase
        .from('crm_contatos')
        .update({ ...mudancas, atualizado_em: new Date().toISOString() })
        .eq('id', contato_id)
        .select(COLUNAS_RESUMO)
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
  },

  {
    nome: 'mover_no_funil',
    descricao: 'Move um lead para outra etapa do funil.',
    permissao: 'crm.editar',
    confirmar: true,
    parametros: {
      type: 'object',
      properties: {
        contato_id: texto('Id do lead.'),
        status_funil: { type: 'string', enum: ETAPAS_FUNIL, description: 'Etapa de destino.' },
      },
      required: ['contato_id', 'status_funil'],
      additionalProperties: false,
    },
    resumo: async (a, ctx) => `Mover ${await nomeDoContato(ctx, a.contato_id)} para "${a.status_funil}"`,
    executar: async (args, ctx) => {
      const contato = await buscarContatoOuFalhar(ctx, args.contato_id);
      if (contato.status_funil === args.status_funil) {
        return { inalterado: true, motivo: `O contato ja esta em "${args.status_funil}".`, contato };
      }

      const { data, error } = await ctx.supabase
        .from('crm_contatos')
        .update({ status_funil: args.status_funil, atualizado_em: new Date().toISOString() })
        .eq('id', args.contato_id)
        .select(COLUNAS_RESUMO)
        .single();
      if (error) throw new Error(error.message);
      return { anterior: contato.status_funil, contato: data };
    },
  },

  {
    nome: 'converter_em_cliente',
    descricao:
      'Converte um lead em cliente. O banco registra a interacao de conversao e notifica o time; ' +
      'nao registre nada disso por fora.',
    permissao: 'crm.editar',
    confirmar: true,
    parametros: {
      type: 'object',
      properties: { contato_id: texto('Id do lead a converter.') },
      required: ['contato_id'],
      additionalProperties: false,
    },
    resumo: async (a, ctx) => `Converter ${await nomeDoContato(ctx, a.contato_id)} em cliente`,
    executar: async (args, ctx) => {
      const contato = await buscarContatoOuFalhar(ctx, args.contato_id);
      if (contato.tipo_registro === 'cliente') {
        return { inalterado: true, motivo: 'Este contato ja e cliente.', contato };
      }

      const agora = new Date().toISOString();
      const { data, error } = await ctx.supabase
        .from('crm_contatos')
        .update({
          tipo_registro: 'cliente',
          convertido_em: agora,
          convertido_por: ctx.usuario.id,
          atualizado_em: agora,
        })
        .eq('id', args.contato_id)
        .select(COLUNAS_RESUMO)
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
  },
];

export const ferramentaPorNome = (nome: string): Ferramenta | undefined =>
  FERRAMENTAS.find((f) => f.nome === nome);

/** Ferramentas que o cargo do usuario alcanca. E o que vai no payload da OpenAI. */
export const ferramentasPermitidas = (permissoes: string[] | null): Ferramenta[] =>
  FERRAMENTAS.filter((f) => temPermissao(permissoes, f.permissao));

/** Traduz o catalogo para o formato de tools da OpenAI. */
export const comoToolsOpenAI = (ferramentas: Ferramenta[]) =>
  ferramentas.map((f) => ({
    type: 'function',
    function: { name: f.nome, description: f.descricao, parameters: f.parametros },
  }));
