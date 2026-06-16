// =============================================================
// PRANCHETO.IA - LOGS DE SEGURANÇA (Super Admin)
// Visualização dos registros de auditoria do sistema.
//
// FUNCIONALIDADES:
//   - Listar todos os eventos de auditoria com paginação
//   - Filtros: ação, resultado (success/failure/blocked), busca por email/rota
//   - Destaque visual por resultado (verde=sucesso, vermelho=falha, âmbar=bloqueado)
//   - Expandir linha para ver detalhes completos do evento
//
// ROTA: /admin/seguranca
// ACESSO: Apenas Super Admin
// Backend: GET /api/admin/logs + GET /api/admin/logs/acoes
// =============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api.js';

// =============================================================
// CONSTANTES
// =============================================================
const COR_RESULTADO = {
  success: {
    badge:  'bg-green-900/50 text-green-400 border-green-700/50',
    ponto:  'bg-green-400',
    label:  'Sucesso',
  },
  failure: {
    badge:  'bg-red-900/50 text-red-400 border-red-700/50',
    ponto:  'bg-red-400',
    label:  'Falha',
  },
  blocked: {
    badge:  'bg-amber-900/50 text-amber-400 border-amber-700/50',
    ponto:  'bg-amber-400',
    label:  'Bloqueado',
  },
};

const EMOJI_ACAO = {
  login:               '🔑',
  logout:              '🚪',
  create:              '➕',
  update:              '✏️',
  delete:              '🗑️',
  view:                '👁️',
  export:              '📤',
  permission_change:   '🔐',
  impersonation_inicio:'👤',
  impersonation_fim:   '↩️',
  activate:            '✅',
  deactivate:          '🚫',
  login_failed:        '⚠️',
  blocked:             '🛡️',
};

// Formata data/hora no padrão brasileiro
const formatarDataHora = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('pt-BR', {
    day:    '2-digit',
    month:  '2-digit',
    year:   'numeric',
    hour:   '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

// =============================================================
// COMPONENTE: Spinner
// =============================================================
const Spinner = ({ tamanho = 'md' }) => {
  const cls = tamanho === 'sm' ? 'w-4 h-4 border-2' : 'w-8 h-8 border-4';
  return <div className={`${cls} border-primary-500 border-t-transparent rounded-full animate-spin`} />;
};

// =============================================================
// COMPONENTE: Linha de Log (expansível)
// =============================================================
const LinhaLog = ({ log }) => {
  const [expandido, setExpandido] = useState(false);
  const cor = COR_RESULTADO[log.resultado] || COR_RESULTADO.success;
  const emoji = EMOJI_ACAO[log.acao] || '📋';

  return (
    <>
      <tr
        onClick={() => setExpandido(!expandido)}
        className="hover:bg-primary-900/20 transition-colors cursor-pointer"
      >
        {/* Data/hora */}
        <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
          {formatarDataHora(log.criado_em)}
        </td>

        {/* Ação */}
        <td className="px-4 py-3">
          <span className="flex items-center gap-1.5 text-sm text-slate-300">
            <span>{emoji}</span>
            <span className="font-mono text-xs">{log.acao}</span>
          </span>
        </td>

        {/* Usuário */}
        <td className="px-4 py-3">
          <p className="text-white text-sm truncate max-w-[180px]">{log.user_email || '—'}</p>
          {log.user_cargo && (
            <p className="text-slate-500 text-xs">{log.user_cargo}</p>
          )}
        </td>

        {/* Cliente */}
        <td className="px-4 py-3 text-slate-400 text-sm">
          {log.tenantNome || <span className="text-slate-600 italic">Super Admin</span>}
        </td>

        {/* Resultado */}
        <td className="px-4 py-3">
          <span className={`inline-flex items-center gap-1.5 badge border ${cor.badge}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cor.ponto}`} />
            {cor.label}
          </span>
        </td>

        {/* IP */}
        <td className="px-4 py-3 text-slate-500 text-xs font-mono">
          {log.ip_address || '—'}
        </td>

        {/* Expandir */}
        <td className="px-4 py-3 text-right">
          <span className="text-slate-500 text-xs">{expandido ? '▲' : '▼'}</span>
        </td>
      </tr>

      {/* Linha expandida com detalhes */}
      {expandido && (
        <tr className="bg-primary-950/50">
          <td colSpan={7} className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Descrição */}
              {log.descricao && (
                <div className="md:col-span-2">
                  <p className="text-slate-500 mb-1">Descrição</p>
                  <p className="text-slate-300 bg-primary-900/50 px-3 py-2 rounded-lg">{log.descricao}</p>
                </div>
              )}

              {/* Rota */}
              {log.rota && (
                <div>
                  <p className="text-slate-500 mb-1">Rota</p>
                  <p className="text-slate-300 font-mono bg-primary-900/50 px-3 py-2 rounded-lg">
                    <span className="text-primary-400">{log.metodo_http}</span> {log.rota}
                  </p>
                </div>
              )}

              {/* Recurso */}
              {log.recurso && (
                <div>
                  <p className="text-slate-500 mb-1">Recurso</p>
                  <p className="text-slate-300 bg-primary-900/50 px-3 py-2 rounded-lg">
                    {log.recurso}
                    {log.recurso_id && <span className="text-slate-500 ml-2 font-mono">{log.recurso_id}</span>}
                  </p>
                </div>
              )}

              {/* Código de erro */}
              {log.codigo_erro && (
                <div>
                  <p className="text-slate-500 mb-1">Código de erro</p>
                  <p className="text-red-400 font-mono bg-red-900/20 px-3 py-2 rounded-lg">{log.codigo_erro}</p>
                </div>
              )}

              {/* ID do log */}
              <div>
                <p className="text-slate-500 mb-1">ID do evento</p>
                <p className="text-slate-600 font-mono bg-primary-900/50 px-3 py-2 rounded-lg truncate">{log.id}</p>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

// =============================================================
// COMPONENTE PRINCIPAL: LogsSeguranca
// =============================================================
const LogsSeguranca = () => {
  const navigate = useNavigate();

  const [logs,         setLogs]         = useState([]);
  const [acoes,        setAcoes]        = useState([]);
  const [carregando,   setCarregando]   = useState(true);
  const [erro,         setErro]         = useState(null);
  const [pagina,       setPagina]       = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [total,        setTotal]        = useState(0);
  const [busca,        setBusca]        = useState('');
  const [filtroAcao,   setFiltroAcao]   = useState('');
  const [filtroResult, setFiltroResult] = useState('');

  // --- Carregar ações disponíveis para o filtro ---
  const carregarAcoes = useCallback(async () => {
    try {
      const resp = await api.get('/admin/logs/acoes');
      setAcoes(resp.data?.acoes || []);
    } catch {
      // silencioso
    }
  }, []);

  // --- Carregar logs ---
  const carregarLogs = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const params = { pagina, limite: 30 };
      if (busca)        params.busca     = busca;
      if (filtroAcao)   params.acao      = filtroAcao;
      if (filtroResult) params.resultado = filtroResult;

      const resp = await api.get('/admin/logs', { params });
      const { logs: lista, paginacao } = resp.data;

      setLogs(lista || []);
      setTotal(paginacao?.total || 0);
      setTotalPaginas(paginacao?.totalPaginas || 1);
    } catch (err) {
      setErro(err?.response?.data?.mensagem || err?.response?.data?.erro || 'Erro ao carregar logs.');
    } finally {
      setCarregando(false);
    }
  }, [pagina, busca, filtroAcao, filtroResult]);

  useEffect(() => { carregarAcoes(); }, [carregarAcoes]);
  useEffect(() => { carregarLogs(); }, [carregarLogs]);

  // Debounce na busca
  useEffect(() => {
    const timer = setTimeout(() => setPagina(1), 400);
    return () => clearTimeout(timer);
  }, [busca]);

  // =============================================================
  // RENDER
  // =============================================================
  return (
    <div className="flex flex-col min-h-screen bg-surface">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-primary-800 bg-primary-950/50">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin')}
            className="text-slate-400 hover:text-white transition-colors text-sm flex items-center gap-1"
          >
            ← Voltar
          </button>
          <span className="text-slate-600">|</span>
          <span className="text-2xl">🛡️</span>
          <div>
            <span className="text-white font-semibold">Logs de Segurança</span>
            <span className="ml-2 badge bg-primary-900 text-primary-300 border border-primary-700">
              Super Admin
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <span>🔒</span>
          <span>Registros imutáveis — somente leitura</span>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto space-y-5">

          {/* Filtros */}
          <div className="flex flex-wrap gap-3 items-center">
            {/* Busca */}
            <div className="relative flex-1 min-w-[220px]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por e-mail, rota ou descrição..."
                className="input w-full pl-9"
              />
            </div>

            {/* Filtro por ação */}
            <select
              value={filtroAcao}
              onChange={(e) => { setFiltroAcao(e.target.value); setPagina(1); }}
              className="input w-48"
            >
              <option value="">Todas as ações</option>
              {acoes.map(a => (
                <option key={a} value={a}>
                  {EMOJI_ACAO[a] || '📋'} {a}
                </option>
              ))}
            </select>

            {/* Filtro por resultado */}
            <select
              value={filtroResult}
              onChange={(e) => { setFiltroResult(e.target.value); setPagina(1); }}
              className="input w-40"
            >
              <option value="">Todos os resultados</option>
              <option value="success">✅ Sucesso</option>
              <option value="failure">❌ Falha</option>
              <option value="blocked">🛡️ Bloqueado</option>
            </select>

            {/* Contador */}
            <span className="text-slate-400 text-sm whitespace-nowrap">
              {total.toLocaleString('pt-BR')} evento{total !== 1 ? 's' : ''}
            </span>

            {/* Botão de atualizar */}
            <button
              onClick={() => carregarLogs()}
              disabled={carregando}
              className="btn-secondary text-sm px-3 py-2 flex items-center gap-1.5"
              title="Atualizar logs"
            >
              {carregando ? <Spinner tamanho="sm" /> : '🔄'}
              Atualizar
            </button>
          </div>

          {/* Tabela */}
          <div className="card p-0 overflow-hidden">
            {carregando ? (
              <div className="flex items-center justify-center py-16"><Spinner /></div>
            ) : erro ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <span className="text-4xl">⚠️</span>
                <p className="text-slate-400 text-sm">{erro}</p>
                <button onClick={carregarLogs} className="btn-secondary text-sm">Tentar novamente</button>
              </div>
            ) : logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <span className="text-4xl">🛡️</span>
                <p className="text-slate-400 text-sm">
                  {busca || filtroAcao || filtroResult
                    ? 'Nenhum evento encontrado com os filtros aplicados.'
                    : 'Nenhum evento de auditoria registrado ainda.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-primary-800 bg-primary-950/30">
                      <th className="text-left px-4 py-3 text-slate-400 font-medium whitespace-nowrap">Data/Hora</th>
                      <th className="text-left px-4 py-3 text-slate-400 font-medium">Ação</th>
                      <th className="text-left px-4 py-3 text-slate-400 font-medium">Usuário</th>
                      <th className="text-left px-4 py-3 text-slate-400 font-medium">Cliente</th>
                      <th className="text-left px-4 py-3 text-slate-400 font-medium">Resultado</th>
                      <th className="text-left px-4 py-3 text-slate-400 font-medium">IP</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-primary-800/50">
                    {logs.map((log) => (
                      <LinhaLog key={log.id} log={log} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Paginação */}
          {totalPaginas > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setPagina(p => Math.max(1, p - 1))}
                disabled={pagina === 1 || carregando}
                className="btn-secondary text-sm px-3 py-1.5 disabled:opacity-40"
              >
                ← Anterior
              </button>
              <span className="text-slate-400 text-sm">Página {pagina} de {totalPaginas}</span>
              <button
                onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
                disabled={pagina === totalPaginas || carregando}
                className="btn-secondary text-sm px-3 py-1.5 disabled:opacity-40"
              >
                Próxima →
              </button>
            </div>
          )}

          {/* Nota de conformidade */}
          <p className="text-center text-slate-600 text-xs">
            🔒 Logs de auditoria são imutáveis por design — nenhum registro pode ser editado ou excluído.
            Conformidade com LGPD Art. 37.
          </p>
        </div>
      </main>
    </div>
  );
};

export default LogsSeguranca;
