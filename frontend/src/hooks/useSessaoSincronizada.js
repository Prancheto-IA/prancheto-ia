// =============================================================
// PRANCHETO.IA - SINCRONIA ENTRE STORE E SESSAO
//
// O authStore e persistido em localStorage, e ate aqui ninguem
// conferia se o usuario guardado ainda e o dono da sessao ativa do
// Supabase. As duas coisas divergem com mais facilidade do que
// parece: trocar de conta na mesma aba, uma sessao que expirou, um
// banco de desenvolvimento recriado.
//
// Divergindo, o app segue operando com dados do usuario A enquanto o
// JWT e do usuario B. Leitura fica errada em silencio, e escrita bate
// no RLS com "new row violates row-level security policy" — mensagem
// que nao aponta para nada do que realmente aconteceu.
//
// Aqui a sessao e a fonte de verdade. Divergiu, o estado local e
// descartado e a pessoa entra de novo. Perder um login vale mais do
// que operar sobre identidade errada.
//
// Impersonation nao e afetada: iniciarImpersonation troca a sessao
// real via supabase.auth.setSession, entao store e sessao continuam
// apontando para o mesmo usuario.
// =============================================================

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';
import { useAuthStore } from '../store/authStore.js';

export const useSessaoSincronizada = () => {
  const [verificando, setVerificando] = useState(true);

  useEffect(() => {
    let ativo = true;

    const conferirAgora = async () => {
      const { token, usuario, logout } = useAuthStore.getState();

      // Sem nada guardado nao ha o que divergir. Evita uma ida a rede
      // em toda visita de quem nem entrou ainda.
      if (!token && !usuario) {
        if (ativo) setVerificando(false);
        return;
      }

      try {
        const { data } = await supabase.auth.getUser();
        const idDaSessao = data?.user?.id ?? null;

        // Sem sessao, ou sessao de outra pessoa: o guardado nao vale.
        if (!idDaSessao || (usuario?.id && idDaSessao !== usuario.id)) {
          logout();
        }
      } catch {
        // Falha de rede nao e prova de divergencia. Derrubar a sessao
        // por instabilidade seria pior do que seguir com o cache.
      } finally {
        if (ativo) setVerificando(false);
      }
    };

    conferirAgora();

    // A divergencia tambem nasce com a aba aberta: logout em outra
    // aba, refresh que falha, troca de conta.
    const { data: assinatura } = supabase.auth.onAuthStateChange((evento, sessao) => {
      const { usuario, logout } = useAuthStore.getState();

      if (evento === 'SIGNED_OUT') {
        if (usuario) logout();
        return;
      }

      const idDaSessao = sessao?.user?.id;
      if (idDaSessao && usuario?.id && idDaSessao !== usuario.id) logout();
    });

    return () => {
      ativo = false;
      assinatura?.subscription?.unsubscribe();
    };
  }, []);

  return { verificando };
};
