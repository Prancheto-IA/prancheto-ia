// =============================================================
// PRANCHETO.IA - BANNER DE IMPERSONATION
// Componente flutuante exibido quando o Super Admin está
// acessando o sistema como outro usuário (impersonation).
//
// Exibe:
//   - Nome/email do usuário sendo impersonado
//   - Nome do tenant do usuário
//   - Botão "Voltar para Admin" para encerrar a sessão
//
// Posicionamento: fixo no topo da tela, z-index alto para
// sobrepor qualquer outro conteúdo.
// =============================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore.js';
import api from '../../services/api.js';

// =============================================================
// COMPONENTE PRINCIPAL
// =============================================================
const BannerImpersonation = () => {
  const navigate = useNavigate();
  const { isImpersonating, usuario, encerrarImpersonation } = useAuthStore();
  const [encerrando, setEncerrando] = useState(false);
  const [erro, setErro]             = useState(null);

  // Não renderiza nada se não estiver em modo impersonation
  if (!isImpersonating) return null;

  const handleEncerrar = async () => {
    setEncerrando(true);
    setErro(null);

    try {
      // Chama o backend para encerrar o impersonation e obter novo token do Super Admin
      const resposta = await api.post('/admin/impersonate/stop');
      const { token: novoToken } = resposta.data;

      // Restaura a sessão do Super Admin no store
      encerrarImpersonation(novoToken);

      // Redireciona de volta ao painel admin
      navigate('/admin', { replace: true });
    } catch (err) {
      const mensagem =
        err?.response?.data?.mensagem ||
        err?.response?.data?.erro ||
        'Erro ao encerrar sessão. Tente novamente.';
      setErro(mensagem);
      setEncerrando(false);
    }
  };

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-between px-4 py-2.5 bg-amber-500 text-amber-950 shadow-lg"
      role="alert"
      aria-live="polite"
    >
      {/* Ícone + Informações do usuário impersonado */}
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-xl flex-shrink-0" aria-hidden="true">👁️</span>
        <div className="min-w-0">
          <p className="font-semibold text-sm leading-tight truncate">
            Modo Visualização Ativo
          </p>
          <p className="text-xs opacity-80 truncate">
            Acessando como:{' '}
            <strong>{usuario?.nome || usuario?.email || 'Usuário'}</strong>
            {usuario?.tenantNome && (
              <span className="ml-1">— {usuario.tenantNome}</span>
            )}
          </p>
        </div>
      </div>

      {/* Mensagem de erro inline */}
      {erro && (
        <p className="text-xs font-medium text-red-800 bg-red-100 px-2 py-1 rounded mx-3 flex-shrink-0">
          {erro}
        </p>
      )}

      {/* Botão de encerrar */}
      <button
        onClick={handleEncerrar}
        disabled={encerrando}
        className={`
          flex-shrink-0 flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-semibold
          bg-amber-950 text-amber-100 hover:bg-amber-900
          transition-colors duration-150
          disabled:opacity-60 disabled:cursor-not-allowed
          focus:outline-none focus:ring-2 focus:ring-amber-950 focus:ring-offset-1 focus:ring-offset-amber-500
        `}
        aria-label="Encerrar modo de visualização e voltar ao painel admin"
      >
        {encerrando ? (
          <>
            <span
              className="w-3.5 h-3.5 border-2 border-amber-100 border-t-transparent rounded-full animate-spin"
              aria-hidden="true"
            />
            Encerrando...
          </>
        ) : (
          <>
            <span aria-hidden="true">🔙</span>
            Voltar para Admin
          </>
        )}
      </button>
    </div>
  );
};

export default BannerImpersonation;
