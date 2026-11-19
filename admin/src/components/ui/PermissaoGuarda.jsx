// =============================================================
// PRANCHETO.IA - GUARDA DE PERMISSÃO
//
// Renderiza o conteúdo apenas se o usuário tiver a permissão exigida.
// Sem permissão, renderiza o fallback (por padrão nada) — o recurso
// simplesmente não aparece, sem mensagem de erro nem pista de que existe.
//
//   <PermissaoGuarda permissao="cargos.gerenciar">
//     <BotaoNovoCargo />
//   </PermissaoGuarda>
//
//   <PermissaoGuarda permissao={['crm.editar', 'crm.excluir']} modo="alguma">
//     <MenuDeAcoes />
//   </PermissaoGuarda>
//
//   <PermissaoGuarda cargo={['admin']} fallback={<AvisoSemAcesso />}>
//     <ConfiguracoesAvancadas />
//   </PermissaoGuarda>
//
// Isto é controle de interface. A barreira real é o RLS no banco.
// =============================================================

import { usePermission } from '../../hooks/usePermission.js';

/**
 * @param {string|string[]} [permissao] - Slug do catálogo, ou lista deles
 * @param {'todas'|'alguma'} [modo] - Como avaliar a lista (padrão: 'todas')
 * @param {string|string[]} [cargo] - Cargo do sistema (users.cargo)
 * @param {React.ReactNode} children
 * @param {React.ReactNode} [fallback] - Alternativa quando não há permissão
 */
const PermissaoGuarda = ({
  permissao,
  modo = 'todas',
  cargo,
  children,
  fallback = null,
}) => {
  const { pode, podeAlguma, podeTodas, temCargo } = usePermission();

  if (cargo && !temCargo(cargo)) return fallback;

  if (permissao) {
    const liberado = Array.isArray(permissao)
      ? (modo === 'alguma' ? podeAlguma(permissao) : podeTodas(permissao))
      : pode(permissao);

    if (!liberado) return fallback;
  }

  return children;
};

export default PermissaoGuarda;
