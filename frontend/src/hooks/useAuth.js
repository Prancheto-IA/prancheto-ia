// =============================================================
// PRANCHETO.IA - HOOK DE AUTENTICAÇÃO (useAuth)
// Encapsula toda a lógica de login/logout e comunicação com a API.
//
// REDIRECIONAMENTO INTELIGENTE POR CARGO:
//   - super_admin  → /admin     (Painel Administrativo)
//   - admin/manager/member/viewer → /dashboard (Dashboard do Cliente)
// =============================================================

import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
import api from '../services/api.js';

/**
 * Determina a rota de destino após o login baseado no cargo do usuário.
 * @param {object} usuario - Dados do usuário retornados pelo backend
 * @returns {string} Rota de destino
 */
const rotaDestino = (usuario) => {
  if (usuario?.isSuperAdmin) return '/admin';
  return '/dashboard';
};

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
   *   - super_admin → /admin (Painel Administrativo oculto)
   *   - Demais cargos → /dashboard (Dashboard do Cliente)
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

      // Redireciona baseado no cargo do usuário
      navigate(rotaDestino(data.usuario), { replace: true });

    } catch (erro) {
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
      await api.post('/auth/logout').catch(() => {});
    } finally {
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
