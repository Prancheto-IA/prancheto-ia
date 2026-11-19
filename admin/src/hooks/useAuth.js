// =============================================================
// PRANCHETO.IA - HOOK DE AUTENTICAÇÃO DO PAINEL ADMIN (useAuth)
// Restrito exclusivamente a usuários com cargo 'super_admin'.
// =============================================================

import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
import { supabase } from '../lib/supabase.js';

export const useAuth = () => {
  const navigate = useNavigate();
  const {
    login: loginStore,
    logout: logoutStore,
    setCarregando,
    setErroLogin,
    carregando,
    erroLogin,
  } = useAuthStore();

  const login = async (email, senha) => {
    setCarregando(true);
    setErroLogin(null);

    try {
      // 1. Autenticação via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password: senha,
      });

      if (authError) throw authError;

      // 2. Busca o perfil estendido do usuário na tabela 'users'
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (profileError || !userProfile) {
        await supabase.auth.signOut();
        throw new Error('Perfil de usuário não encontrado no sistema.');
      }

      if (userProfile.ativo === false) {
        await supabase.auth.signOut();
        throw new Error('Sua conta está desativada.');
      }

      // Validação estrita: somente super_admin
      const isSuperAdmin = userProfile.cargo === 'super_admin';
      if (!isSuperAdmin) {
        await supabase.auth.signOut();
        throw new Error('Acesso negado: este painel é restrito exclusivamente a Super Admins.');
      }

      const usuarioCompleto = {
        ...userProfile,
        isSuperAdmin: true,
      };

      // 3. Salva no store
      loginStore(authData.session.access_token, authData.session.refresh_token, usuarioCompleto);

      // 4. Redireciona para o dashboard admin
      navigate('/admin', { replace: true });
    } catch (erro) {
      setErroLogin(erro.message || 'Erro ao realizar login no painel administrativo.');
    } finally {
      setCarregando(false);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Erro ao deslogar do Supabase:', e);
    }
    logoutStore();
    navigate('/login', { replace: true });
  };

  return {
    login,
    logout,
    carregando,
    erroLogin,
  };
};

