// =============================================================
// PRANCHETO.IA - HOOK DE AUTENTICAÇÃO (useAuth)
// Encapsula toda a lógica de login/logout e comunicação com a API.
// Uso nos componentes:
//   const { login, logout, carregando, erro } = useAuth();
// =============================================================

import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
import api from '../services/api.js';

/**
 * Hook customizado que fornece as ações de autenticação.
 * Conecta o formulário de login à API do back-end.
 */
export const useAuth = () => {
  const navigate = useNavigate();
  const {
    login:         loginStore,
    logout:        logoutStore,
    setCarregando,
    setErroLogin,
    carregando,
    erroLogin,
  } = useAuthStore();

  /**
   * Realiza o login do usuário.
   * Após login bem-sucedido, redireciona automaticamente:
   *   - Super Admin → /admin (Painel Administrativo oculto)
   *   - Usuário comum → /crm (CRM padrão)
   *
   * @param {string} email
   * @param {string} senha
   */
  const login = async (email, senha) => {
    setCarregando(true);
    setErroLogin(null);

    try {
      const { data } = await api.post('/auth/login', { email, senha });

      // Armazena os tokens e dados do usuário no store (Zustand + localStorage)
      loginStore(data.token, data.refreshToken, data.usuario);

      // Redireciona baseado no tipo de usuário
      if (data.usuario.isSuperAdmin) {
        navigate('/admin', { replace: true });
      } else {
        navigate('/crm', { replace: true });
      }

    } catch (erro) {
      // O interceptor do Axios já formata a mensagem de erro do back-end
      setErroLogin(erro.message || 'Erro ao fazer login. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  /**
   * Realiza o logout do usuário.
   * Notifica o back-end para invalidar o refresh token,
   * limpa o estado local e redireciona para o login.
   */
  const logout = async () => {
    try {
      // Notifica o back-end (best-effort: não bloqueia o logout se falhar)
      await api.post('/auth/logout').catch(() => {});
    } finally {
      // Sempre limpa o estado local, independente da resposta do servidor
      logoutStore();
      navigate('/login', { replace: true });
    }
  };

  return {
    login,
    logout,
    carregando,
    erroLogin,
  };
};
