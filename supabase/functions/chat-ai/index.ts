/// <reference path="../deno-ambient.d.ts" />

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SYSTEM_PROMPT = `Você é um assistente especializado no Prancheto.IA, um CRM SaaS modular e multi-tenant.
Seu papel é ajudar o Super Admin a:
1. Criar e configurar novos módulos CRM
2. Gerar código JavaScript/React
3. Sugerir estruturas de banco
4. Resolver problemas técnicos
Seja direto, técnico e objetivo nas respostas.`;

serve(async (req: Request) => {
  // Tratar CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { conversationId, mensagem } = await req.json()

    if (!mensagem || !conversationId) {
      return new Response(JSON.stringify({ erro: 'conversationId e mensagem são obrigatórios' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    // Inicializa o cliente Supabase usando o header Authorization da requisição original
    // Isso garante que o RLS seja aplicado corretamente
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Busca a conversa (o RLS garante que o usuário só veja as próprias conversas ativas)
    const { data: conversa, error: erroConversa } = await supabaseClient
      .from('ai_conversations')
      .select('*')
      .eq('id', conversationId)
      .eq('status', 'ativa')
      .single()

    if (erroConversa || !conversa) {
      return new Response(JSON.stringify({ erro: 'Conversa não encontrada ou sem acesso.' }), { 
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    // Salva a mensagem do usuário (otimisticamente o frontend pode já ter exibido, mas salva no banco real)
    const { data: msgUsuarioArr, error: erroMsgUsuario } = await supabaseClient
      .from('ai_messages')
      .insert({
        conversation_id: conversationId,
        remetente: 'user',
        conteudo: mensagem,
        tokens_usados: 0
      })
      .select('id, remetente, conteudo, criado_em')

    if (erroMsgUsuario) throw erroMsgUsuario

    const msgUsuario = msgUsuarioArr[0]

    // Busca histórico de mensagens (otimizado com janela deslizante de 12 mensagens)
    const { data: ultimasMensagens, error: erroHistorico } = await supabaseClient
      .from('ai_messages')
      .select('remetente, conteudo')
      .eq('conversation_id', conversationId)
      .order('criado_em', { ascending: false })
      .limit(12);

    if (erroHistorico) throw erroHistorico;
    const historico = (ultimasMensagens || []).reverse();

    // Prepara as mensagens para o modelo
    const mensagensOpenAI = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...(historico || []).map((msg: any) => ({
        role: msg.remetente === 'user' ? 'user' : 'assistant',
        content: msg.conteudo
      }))
    ]

    // Configura o provedor de IA (Google Gemini ou OpenAI)
    const geminiKey = Deno.env.get('GEMINI_API_KEY') || Deno.env.get('GOOGLE_API_KEY')
    const openaiKey = Deno.env.get('OPENAI_API_KEY')

    let url: string
    let apiKey: string
    let modelo: string
    let nomeProvedor: string

    if (geminiKey) {
      nomeProvedor = 'Google Gemini'
      apiKey = geminiKey
      const baseUrl = (Deno.env.get('GEMINI_BASE_URL') || 'https://generativelanguage.googleapis.com/v1beta/openai').replace(/\/+$/, '')
      url = baseUrl.endsWith('/chat/completions') ? baseUrl : `${baseUrl}/chat/completions`
      const modeloEnv = Deno.env.get('GEMINI_MODEL')
      const modeloConversa = conversa.modelo && !conversa.modelo.startsWith('gpt-') ? conversa.modelo : null
      modelo = modeloEnv || modeloConversa || 'gemini-2.5-flash'
    } else if (openaiKey) {
      nomeProvedor = 'OpenAI'
      apiKey = openaiKey
      const baseUrl = (Deno.env.get('OPENAI_BASE_URL') || Deno.env.get('OPENAI_ENDPOINT') || 'https://api.openai.com/v1').replace(/\/+$/, '')
      url = baseUrl.endsWith('/chat/completions') ? baseUrl : `${baseUrl}/chat/completions`
      const modeloEnv = Deno.env.get('OPENAI_MODEL')
      const modeloConversa = conversa.modelo && !conversa.modelo.startsWith('gemini-') ? conversa.modelo : null
      modelo = modeloEnv || modeloConversa || 'gpt-4o-mini'
    } else {
      throw new Error('Nenhuma chave de IA configurada. Configure GEMINI_API_KEY (ou OPENAI_API_KEY) nos secrets do Supabase.')
    }

    const aiResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: modelo,
        messages: mensagensOpenAI,
        max_tokens: 1024,
        temperature: 0.7
      })
    })

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text()
      throw new Error(`Erro ${nomeProvedor}: ${aiResponse.status} - ${errorText}`)
    }

    const openaiData = await aiResponse.json()
    const conteudoResposta = openaiData.choices[0]?.message?.content || ''
    const tokensUsados = openaiData.usage?.completion_tokens || 0
    const tokensTotal = openaiData.usage?.total_tokens || 0

    // Salva a resposta da IA no Supabase
    const { data: msgAssistenteArr, error: erroInsertAI } = await supabaseClient
      .from('ai_messages')
      .insert({
        conversation_id: conversationId,
        remetente: 'assistant',
        conteudo: conteudoResposta,
        tokens_usados: tokensUsados,
        metadata: {
          finish_reason: openaiData.choices[0]?.finish_reason,
          model: openaiData.model,
          total_tokens: tokensTotal
        }
      })
      .select('id, remetente, conteudo, tokens_usados, criado_em')

    if (erroInsertAI) throw erroInsertAI

    const msgAssistente = msgAssistenteArr[0]

    // Atualiza estatísticas da conversa
    await supabaseClient
      .from('ai_conversations')
      .update({
        total_tokens: (conversa.total_tokens || 0) + tokensTotal,
        atualizado_em: new Date().toISOString()
      })
      .eq('id', conversationId)

    // Retorna para o frontend
    return new Response(JSON.stringify({
      sucesso: true,
      mensagem_usuario: msgUsuario,
      resposta_ia: msgAssistente,
      uso: {
        tokens_resposta: tokensUsados,
        tokens_total: tokensTotal
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ erro: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
