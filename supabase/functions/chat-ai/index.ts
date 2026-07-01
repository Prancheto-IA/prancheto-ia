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

serve(async (req) => {
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

    // Busca histórico de mensagens
    const { data: historico, error: erroHistorico } = await supabaseClient
      .from('ai_messages')
      .select('remetente, conteudo')
      .eq('conversation_id', conversationId)
      .order('criado_em', { ascending: true })

    if (erroHistorico) throw erroHistorico

    // Prepara as mensagens para a OpenAI
    const mensagensOpenAI = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...(historico || []).map((msg: any) => ({
        role: msg.remetente === 'user' ? 'user' : 'assistant',
        content: msg.conteudo
      }))
    ]

    // Chama a API da OpenAI
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY não configurada na Edge Function')
    }

    const openAiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: conversa.modelo || 'gpt-4o-mini',
        messages: mensagensOpenAI,
        max_tokens: 2048,
        temperature: 0.7
      })
    })

    if (!openAiResponse.ok) {
      const errorText = await openAiResponse.text()
      throw new Error(`Erro OpenAI: ${openAiResponse.status} - ${errorText}`)
    }

    const openaiData = await openAiResponse.json()
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
