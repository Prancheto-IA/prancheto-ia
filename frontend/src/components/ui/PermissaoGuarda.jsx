// =============================================================
// PRANCHETO.IA - COMPONENTE DE GUARDA DE PERMISSÃO
// Renderiza children apenas se o usuário tiver a permissão necessária.
// Se não tiver permissão, retorna null (invisível — sem mensagem de erro,
// sem rota exposta, sem indicação de que o recurso existe).
//
// Uso:
//   <PermissaoGuarda tipo="secao" nome="comercial">
//     <ModuloComercial />
//   </PermissaoGuarda>
//
//   <PermissaoGuarda tipo="cargo" nome={['admin', 'manager']}>
//     <BotaoDeletar />
//   </PermissaoGuarda>
// =============================================================

import React from 'react';
import { usePermission } from '../../hooks/usePermission.js';

/**
 * Componente de guarda de permissão RBAC.
 * @param {'secao'|'modulo'|'aba'|'widget'|'cargo'} tipo - Tipo de permissão
 * @param {string|string[]} nome - Nome do recurso ou lista de cargos
 * @param {React.ReactNode} children - Conteúdo a renderizar se tiver permissão
 * @param {React.ReactNode} fallback - Conteúdo alternativo (padrão: null)
 */
const PermissaoGuarda = ({ tipo, nome, children, fallback = null }) => {
  const { temPermissao } = usePermission();

  // Verifica a permissão — se não tiver, renderiza o fallback (invisível por padrão)
  if (!temPermissao(tipo, nome)) {
    return fallback;
  }

  return children;
};

export default PermissaoGuarda;
