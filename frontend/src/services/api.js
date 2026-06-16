// =============================================================
// PRANCHETO.IA - CLIENTE HTTP (Axios)
// Instância configurada do Axios para todas as chamadas à API.
// Responsável por:
//   1. Injetar automaticamente o token JWT em todas as requisições
//   2. Renovar o token automaticamente quando expirar (refresh)
//   3. Tratar erros globais de autenticação (401 → logout automático)
//   4. Exibir o código de erro amigável retornado pelo back-end
// =============================================================

import axios from 'axios';
import { useAuthStore } from '../store/authStore.js';

// =============================================================
// CRIAÇÃO DA INSTÂNCIA DO AXIOS
// =============================================================
const api = axios.create({
  // URL base da API (definida no .env do front-end)
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api',

  // Timeout de 90 segundos — a OpenAI pode demorar para responder
  timeout: 90000,

  headers: {
    'Content-Type': 'application/json',
  },
});

// =============================================================
// INTERCEPTOR DE REQUISIÇÃO
// Executado ANTES de cada chamada à API.
// Injeta o token JWT no header Authorization automaticamente.
// =============================================================
api.interceptors.request.use(
  (config) => {
    // Obtém o token atual do store de autenticação
    const { token } = useAuthStore.getState();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (erro) => {
    // Erro ao montar a requisição (raro, mas tratado)
    return Promise.reject(erro);
  }
);

// =============================================================
// INTERCEPTOR DE RESPOSTA
// Executado APÓS cada resposta da API.
// Trata erros globais de autenticação e exibe códigos de erro.
// =============================================================

// Controla se já está tentando renovar o token (evita loop infinito)
let renovandoToken = false;
// Fila de requisições que falharam por token expirado (aguardam renovação)
let filaRenovacao = [];

api.interceptors.response.use(
  // Resposta bem-sucedida: retorna normalmente
  (resposta) => resposta,

  // Resposta com erro
  async (erro) => {
    const requisicaoOriginal = erro.config;

    // --- ERRO 401: Token expirado ou inválido ---
    if (erro.response?.status === 401 && !requisicaoOriginal._jaRenovado) {
      // Marca a requisição para não tentar renovar novamente
      requisicaoOriginal._jaRenovado = true;

      // Se já está renovando, coloca na fila e aguarda
      if (renovandoToken) {
        return new Promise((resolve, reject) => {
          filaRenovacao.push({ resolve, reject });
        }).then((novoToken) => {
          requisicaoOriginal.headers.Authorization = `Bearer ${novoToken}`;
          return api(requisicaoOriginal);
        });
      }

      renovandoToken = true;

      try {
        const { refreshToken, atualizarToken, logout } = useAuthStore.getState();

        if (!refreshToken) {
          // Sem refresh token: faz logout e redireciona para login
          logout();
          window.location.href = '/login';
          return Promise.reject(erro);
        }

        // Tenta renovar o token usando o refresh token
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'}/auth/refresh`,
          { refreshToken }
        );

        const novoToken = data.token;
        atualizarToken(novoToken);

        // Processa a fila de requisições que estavam aguardando
        filaRenovacao.forEach(({ resolve }) => resolve(novoToken));
        filaRenovacao = [];

        // Reexecuta a requisição original com o novo token
        requisicaoOriginal.headers.Authorization = `Bearer ${novoToken}`;
        return api(requisicaoOriginal);

      } catch (erroRenovacao) {
        // Falha ao renovar: faz logout completo
        filaRenovacao.forEach(({ reject }) => reject(erroRenovacao));
        filaRenovacao = [];

        const { logout } = useAuthStore.getState();
        logout();
        window.location.href = '/login';
        return Promise.reject(erroRenovacao);

      } finally {
        renovandoToken = false;
      }
    }

    // --- OUTROS ERROS: Formata a mensagem para exibição ---
    // O back-end pode retornar o campo como 'mensagem' (controllers novos)
    // ou 'erro' (controllers antigos) — lemos os dois para compatibilidade
    const mensagemErro = erro.response?.data?.mensagem
      || erro.response?.data?.erro
      || erro.message
      || 'Erro de conexão com o servidor.';
    const codigoErro   = erro.response?.data?.codigo || 'CRM-0000';

    // Cria um erro enriquecido com os dados do back-end
    const erroFormatado = new Error(mensagemErro);
    erroFormatado.codigo      = codigoErro;
    erroFormatado.statusHttp  = erro.response?.status;
    erroFormatado.dadosOriginais = erro.response?.data;

    return Promise.reject(erroFormatado);
  }
);

export default api;
