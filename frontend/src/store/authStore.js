// =============================================================
// PRANCHETO.IA - STORE DE AUTENTICAÇÃO (Zustand)
// Gerencia o estado global de autenticação:
//   - Token JWT do usuário logado
//   - Dados do usuário (id, nome, cargo, tenant, isSuperAdmin)
//   - Permissões RBAC (quais seções/módulos o usuário pode acessar)
//   - Ações de login e logout
//   - Modo Impersonation (Super Admin acessando como outro usuário)
//
// O estado é persistido no localStorage para sobreviver a
// recarregamentos de página (o usuário não precisa logar novamente).
// =============================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * Store de autenticação do Prancheto.IA.
 * Uso nos componentes:
 *   const { token, usuario, login, logout } = useAuthStore();
 */
export const useAuthStore = create(
  // 'persist' salva o estado no localStorage automaticamente
  persist(
    (set, get) => ({
      // =======================================================
      // ESTADO INICIAL
      // =======================================================

      /** Token JWT retornado pelo back-end após o login */
      token: null,

      /** Token de refresh para renovar o JWT sem novo login */
      refreshToken: null,

      /** Dados completos do usuário logado */
      usuario: null,
      // Estrutura esperada do objeto 'usuario':
      // {
      //   id:          'uuid',
      //   nome:        'João Silva',
      //   email:       'joao@empresa.com',
      //   cargo:       'gerente',
      //   tenantId:    'uuid-do-tenant',
      //   isSuperAdmin: false,
      //   permissoes:  { secoes: ['comercial', 'outreach'], modulos: [...] }
      // }

      /** Indica se uma operação de autenticação está em andamento */
      carregando: false,

      /** Mensagem de erro da última tentativa de login */
      erroLogin: null,

      // =======================================================
      // ESTADO DE IMPERSONATION
      // =======================================================

      /** Indica se o Super Admin está acessando como outro usuário */
      isImpersonating: false,

      /**
       * Token JWT original do Super Admin (salvo durante impersonation).
       * Usado para restaurar a sessão ao encerrar o impersonation.
       */
      superAdminToken: null,

      /** Dados originais do Super Admin (salvos durante impersonation) */
      superAdminUsuario: null,

      // =======================================================
      // AÇÕES
      // =======================================================

      /**
       * Armazena os dados de autenticação após login bem-sucedido.
       * Chamada pelo serviço de API após receber a resposta do back-end.
       * @param {string} token - Token JWT
       * @param {string} refreshToken - Token de refresh
       * @param {object} usuario - Dados do usuário logado
       */
      login: (token, refreshToken, usuario) => {
        set({
          token,
          refreshToken,
          usuario,
          erroLogin:        null,
          carregando:       false,
          isImpersonating:  false,
          superAdminToken:  null,
          superAdminUsuario: null,
        });
      },

      /**
       * Limpa todos os dados de autenticação (logout).
       * Remove o token do localStorage via o middleware 'persist'.
       */
      logout: () => {
        set({
          token:             null,
          refreshToken:      null,
          usuario:           null,
          erroLogin:         null,
          carregando:        false,
          isImpersonating:   false,
          superAdminToken:   null,
          superAdminUsuario: null,
        });
      },

      /**
       * Atualiza apenas o token JWT (usado no refresh automático).
       * @param {string} novoToken - Novo token JWT
       */
      atualizarToken: (novoToken) => {
        set({ token: novoToken });
      },

      /** Define o estado de carregamento durante operações assíncronas */
      setCarregando: (valor) => set({ carregando: valor }),

      /** Define a mensagem de erro de login */
      setErroLogin: (mensagem) => set({ erroLogin: mensagem }),

      // =======================================================
      // AÇÕES DE IMPERSONATION
      // =======================================================

      /**
       * Inicia o modo impersonation: salva a sessão atual do Super Admin
       * e substitui pelo token/usuário do cliente alvo.
       *
       * @param {string} tokenImpersonation - Token JWT gerado pelo backend para o usuário alvo
       * @param {object} usuarioAlvo - Dados do usuário que está sendo impersonado
       */
      iniciarImpersonation: (tokenImpersonation, usuarioAlvo) => {
        const { token, usuario } = get();
        set({
          // Salva a sessão original do Super Admin
          superAdminToken:   token,
          superAdminUsuario: usuario,
          // Substitui pela sessão do usuário alvo
          token:             tokenImpersonation,
          usuario:           usuarioAlvo,
          isImpersonating:   true,
        });
      },

      /**
       * Encerra o modo impersonation: restaura a sessão original do Super Admin.
       * Chamada após o backend confirmar o encerramento e retornar novo token.
       *
       * @param {string} novoTokenSuperAdmin - Novo token JWT do Super Admin (gerado pelo backend)
       */
      encerrarImpersonation: (novoTokenSuperAdmin) => {
        const { superAdminToken, superAdminUsuario } = get();
        set({
          // Restaura a sessão do Super Admin
          token:             novoTokenSuperAdmin || superAdminToken,
          usuario:           superAdminUsuario,
          // Limpa o estado de impersonation
          isImpersonating:   false,
          superAdminToken:   null,
          superAdminUsuario: null,
        });
      },

      // =======================================================
      // GETTERS (seletores derivados)
      // =======================================================

      /** Verifica se o usuário está autenticado */
      estaAutenticado: () => !!get().token,

      /** Verifica se o usuário é Super Admin (Conta Tronco) */
      eSuperAdmin: () => !!get().usuario?.isSuperAdmin,

      /**
       * Verifica se o usuário tem permissão para acessar uma seção específica.
       * @param {string} nomeSecao - Nome da seção (ex: 'comercial', 'outreach')
       * @returns {boolean}
       */
      temPermissaoSecao: (nomeSecao) => {
        const { usuario } = get();
        // Super Admin tem acesso a tudo
        if (usuario?.isSuperAdmin) return true;
        // Verifica na lista de seções permitidas
        return usuario?.permissoes?.secoes?.includes(nomeSecao) ?? false;
      },

      /**
       * Verifica se o usuário tem permissão para acessar um módulo específico.
       * @param {string} nomeModulo - Nome do módulo
       * @returns {boolean}
       */
      temPermissaoModulo: (nomeModulo) => {
        const { usuario } = get();
        if (usuario?.isSuperAdmin) return true;
        return usuario?.permissoes?.modulos?.includes(nomeModulo) ?? false;
      },
    }),

    // --- CONFIGURAÇÃO DA PERSISTÊNCIA ---
    {
      name: 'prancheto-auth', // Chave no localStorage
      storage: createJSONStorage(() => localStorage),
      // Persiste apenas os campos necessários (não persiste 'carregando' e 'erroLogin')
      partialize: (state) => ({
        token:             state.token,
        refreshToken:      state.refreshToken,
        usuario:           state.usuario,
        isImpersonating:   state.isImpersonating,
        superAdminToken:   state.superAdminToken,
        superAdminUsuario: state.superAdminUsuario,
      }),
    }
  )
);
