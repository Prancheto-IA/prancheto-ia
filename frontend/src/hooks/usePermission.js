// =============================================================
// PRANCHETO.IA - HOOK DE PERMISSÕES (usePermission)
//
// Verifica, na interface, as permissões do cargo organizacional do
// usuário logado. Os slugs são os de PERMISSOES_DISPONIVEIS
// (hooks/useOrg.js), gravados em org_cargos.permissoes.
//
//   const { pode } = usePermission();
//   {pode('crm.excluir') && <BotaoExcluir />}
//
// Para trechos maiores, prefira o componente:
//   <PermissaoGuarda permissao="cargos.gerenciar"> ... </PermissaoGuarda>
//
// ISTO É CONTROLE DE INTERFACE, NÃO DE SEGURANÇA.
// Esconder um botão não impede a requisição correspondente. Quem barra
// acesso de verdade é o RLS no banco. Toda permissão que precise ser
// garantida exige também a policy equivalente em PostgreSQL.
// =============================================================

import { useAuthStore } from '../store/authStore.js';

export const usePermission = () => {
  const { usuario, temPermissao, eSuperAdmin } = useAuthStore();

  /** Verifica uma permissão do catálogo. */
  const pode = (slug) => temPermissao(slug);

  /** Verdadeiro se o usuário tiver ao menos uma das permissões. */
  const podeAlguma = (slugs = []) => slugs.some(pode);

  /** Verdadeiro apenas se o usuário tiver todas as permissões. */
  const podeTodas = (slugs = []) => slugs.every(pode);

  /**
   * Verifica o cargo do sistema (users.cargo), não o organizacional.
   * Use para distinções estruturais — super admin, admin do tenant —
   * e não para funcionalidades, que devem usar permissões.
   */
  const temCargo = (cargos) => {
    if (!usuario) return false;
    if (usuario.isSuperAdmin) return true;
    const lista = Array.isArray(cargos) ? cargos : [cargos];
    return lista.includes(usuario.cargo);
  };

  return {
    pode,
    podeAlguma,
    podeTodas,
    temCargo,
    isSuperAdmin: eSuperAdmin(),
    cargo: usuario?.cargo,
    permissoes: usuario?.permissoesCargo ?? null,
  };
};
