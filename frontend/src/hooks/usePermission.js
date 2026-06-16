// =============================================================
// PRANCHETO.IA - HOOK DE PERMISSÕES RBAC (usePermission)
// Verifica as permissões do usuário logado no front-end.
// A IA herda rigidamente as permissões do usuário logado:
// componentes e rotas são invisíveis se não houver permissão.
//
// Uso nos componentes:
//   const { temPermissao, podeVerSecao, podeVerModulo } = usePermission();
//   if (!podeVerSecao('comercial')) return null; // Componente invisível
// =============================================================

import { useAuthStore } from '../store/authStore.js';

/**
 * Hook que fornece funções de verificação de permissão RBAC.
 * Componentes que usam este hook se tornam invisíveis automaticamente
 * quando o usuário não tem permissão — sem mensagem de erro, sem rota exposta.
 */
export const usePermission = () => {
  const {
    usuario,
    temPermissaoSecao,
    temPermissaoModulo,
    eSuperAdmin,
  } = useAuthStore();

  /**
   * Verifica se o usuário tem um dos cargos especificados.
   * @param {string[]} cargos - Lista de cargos permitidos
   * @returns {boolean}
   */
  const temCargo = (cargos) => {
    if (!usuario) return false;
    if (usuario.isSuperAdmin) return true;
    return cargos.includes(usuario.cargo);
  };

  /**
   * Verifica se o usuário pode visualizar uma Seção (Nível 1).
   * @param {string} nomeSecao
   * @returns {boolean}
   */
  const podeVerSecao = (nomeSecao) => {
    return temPermissaoSecao(nomeSecao);
  };

  /**
   * Verifica se o usuário pode visualizar um Módulo (Nível 2).
   * @param {string} nomeModulo
   * @returns {boolean}
   */
  const podeVerModulo = (nomeModulo) => {
    return temPermissaoModulo(nomeModulo);
  };

  /**
   * Verifica se o usuário pode visualizar uma Aba (Nível 3).
   * @param {string} nomeAba
   * @returns {boolean}
   */
  const podeVerAba = (nomeAba) => {
    if (!usuario) return false;
    if (usuario.isSuperAdmin) return true;
    const abasPermitidas = usuario.permissoes?.abas || [];
    return abasPermitidas.includes('*') || abasPermitidas.includes(nomeAba);
  };

  /**
   * Verifica se o usuário pode visualizar um Widget (Nível 4).
   * @param {string} nomeWidget
   * @returns {boolean}
   */
  const podeVerWidget = (nomeWidget) => {
    if (!usuario) return false;
    if (usuario.isSuperAdmin) return true;
    const widgetsPermitidos = usuario.permissoes?.widgets || [];
    return widgetsPermitidos.includes('*') || widgetsPermitidos.includes(nomeWidget);
  };

  /**
   * Componente de guarda: renderiza children apenas se o usuário tiver permissão.
   * Uso: <PermissaoGuarda secao="comercial"><MeuComponente /></PermissaoGuarda>
   * Se não tiver permissão, retorna null (invisível — sem mensagem de erro).
   */
  const temPermissao = (tipo, nome) => {
    switch (tipo) {
      case 'secao':   return podeVerSecao(nome);
      case 'modulo':  return podeVerModulo(nome);
      case 'aba':     return podeVerAba(nome);
      case 'widget':  return podeVerWidget(nome);
      case 'cargo':   return temCargo(Array.isArray(nome) ? nome : [nome]);
      default:        return false;
    }
  };

  return {
    temPermissao,
    temCargo,
    podeVerSecao,
    podeVerModulo,
    podeVerAba,
    podeVerWidget,
    isSuperAdmin: eSuperAdmin(),
    cargo: usuario?.cargo,
  };
};
