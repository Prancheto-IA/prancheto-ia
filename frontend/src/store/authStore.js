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
      //   id:              'uuid',
      //   nome:            'João Silva',
      //   email:           'joao@empresa.com',
      //   cargo:           'manager',        // enum em users.cargo
      //   cargo_id:        'uuid|null',      // cargo organizacional (org_cargos)
      //   tenant_id:       'uuid',
      //   isSuperAdmin:    false,
      //   permissoesCargo: ['crm.ver', 'crm.criar', ...] | null
      // }
      //
      // permissoesCargo vem de org_cargos.permissoes, resolvido no login.
      // null significa "não determinado" — ver temPermissao() abaixo.

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
      
      /** Refresh Token original do Super Admin */
      superAdminRefreshToken: null,

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
          superAdminRefreshToken: null,
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
          superAdminRefreshToken: null,
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
        const { token, refreshToken, usuario } = get();
        set({
          // Salva a sessão original do Super Admin
          superAdminToken:   token,
          superAdminRefreshToken: refreshToken,
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
        const { superAdminToken, superAdminRefreshToken, superAdminUsuario } = get();
        set({
          // Restaura a sessão do Super Admin
          token:             novoTokenSuperAdmin || superAdminToken,
          refreshToken:      superAdminRefreshToken,
          usuario:           superAdminUsuario,
          // Limpa o estado de impersonation
          isImpersonating:   false,
          superAdminToken:   null,
          superAdminRefreshToken: null,
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
       * Verifica se o usuário tem uma permissão do catálogo
       * (PERMISSOES_DISPONIVEIS em hooks/useOrg.js).
       *
       * A lista vem de org_cargos.permissoes, carregada no login a partir
       * de users.cargo_id.
       *
       * QUANDO NÃO HÁ LISTA, LIBERA.
       * Um usuário pode não ter cargo organizacional: signup direto não
       * define cargo_id, e sessões abertas antes desta funcionalidade têm
       * o perfil antigo em cache no localStorage. Negar nesses casos
       * esconderia a interface inteira de quem sempre teve acesso. Como
       * a barreira real é o RLS no banco, liberar aqui não abre brecha —
       * só evita travar gente de fora por falta de dado.
       *
       * @param {string} slug - ex.: 'crm.excluir', 'cargos.gerenciar'
       * @returns {boolean}
       */
      temPermissao: (slug) => {
        const { usuario } = get();
        if (!usuario) return false;
        if (usuario.isSuperAdmin) return true;

        const lista = usuario.permissoesCargo;
        if (!Array.isArray(lista)) return true;

        return lista.includes('*') || lista.includes(slug);
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
        superAdminRefreshToken: state.superAdminRefreshToken,
        superAdminUsuario: state.superAdminUsuario,
      }),
    }
  )
);
