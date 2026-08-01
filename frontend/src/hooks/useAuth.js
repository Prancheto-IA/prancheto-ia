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
import { useTema } from './useTema.js';

const rotaDestino = (usuario) => {
  if (usuario?.cargo === 'super_admin') return '/admin';
  return '/dashboard';
};

/**
 * Busca as permissões do cargo organizacional do usuário.
 * Retorna null quando não há cargo definido ou a consulta falha —
 * null é tratado como "não determinado" e não restringe a interface.
 */
const carregarPermissoesCargo = async (cargoId) => {
  if (!cargoId) return null;
  try {
    const { data, error } = await supabase
      .from('org_cargos')
      .select('permissoes')
      .eq('id', cargoId)
      .single();
    if (error || !data) return null;
    return Array.isArray(data.permissoes) ? data.permissoes : null;
  } catch {
    return null;
  }
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

  // carregarTemaDoUsuario: busca o tema do banco após login e sincroniza
  // Garante que o banco seja a fonte de verdade (não o localStorage)
  const { carregarTemaDoUsuario } = useTema();

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

      // 3. Resolve as permissões do cargo organizacional (org_cargos).
      // Falha aqui não impede o login: permissoesCargo fica null e
      // temPermissao() libera, deixando o RLS como barreira — melhor que
      // trancar o usuário fora por uma consulta que não respondeu.
      const permissoesCargo = await carregarPermissoesCargo(userProfile.cargo_id);

      const usuarioCompleto = {
        ...userProfile,
        isSuperAdmin: userProfile.cargo === 'super_admin',
        permissoesCargo,
      };

      // 3. Salva no store
      loginStore(authData.session.access_token, authData.session.refresh_token, usuarioCompleto);

      // 4. Sincroniza o tema com o banco (banco prevalece sobre localStorage)
      // Não aguarda para não bloquear o redirecionamento
      carregarTemaDoUsuario(userProfile.id).catch(() => {});

      // 5. Redireciona
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
