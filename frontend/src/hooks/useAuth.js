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
import { supabase } from '../lib/supabase.js';

const rotaDestino = (usuario) => {
  if (usuario?.cargo === 'super_admin') return '/admin';
  return '/dashboard';
};

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
        throw new Error('Perfil de usuário não encontrado no sistema.');
      }

      // Adiciona flag conveniente
      const usuarioCompleto = {
        ...userProfile,
        isSuperAdmin: userProfile.cargo === 'super_admin'
      };

      // 3. Salva no store
      // Como o Supabase gerencia o token, não precisamos armazenar tokens customizados
      loginStore(authData.session.access_token, authData.session.refresh_token, usuarioCompleto);

      // 4. Redireciona
      navigate(rotaDestino(usuarioCompleto), { replace: true });

    } catch (erro) {
      setErroLogin(erro.message || 'Erro ao fazer login. Verifique suas credenciais.');
    } finally {
      setCarregando(false);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
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
