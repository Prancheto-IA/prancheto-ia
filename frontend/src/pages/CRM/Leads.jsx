// =============================================================
// PRANCHETO.IA - PÁGINA DE LEADS (FASE 2)
// Funil de entrada: triagem, qualificação, scoring e conversão
// =============================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase.js';
import { useAuthStore } from '../../store/authStore.js';
import { useOrg } from '../../hooks/useOrg.js';
import {
  useLeads,
  ORIGENS, origemInfo,
  formatarMoeda, formatarData, tempoRelativo,
} from '../../hooks/useCRM.js';
import { useRotulosStatus, ETAPAS_CRM_FUNIL, etapaCrmFunilInfo } from '../../hooks/useRotulosStatus.js';
import ModalRotulosStatus from '../../components/RotulosStatus/ModalRotulosStatus.jsx';
import PermissaoGuarda from '../../components/ui/PermissaoGuarda.jsx';
import {
  ENDERECO_VAZIO, CamposNegocio, CampoWhatsapp, CamposEmpresa, limparEndereco,
} from '../../components/crm/CamposContatoExtras.jsx';

// Silos de filtro rápido da tela de Leads. 'recentes' não filtra linhas
// (mesmo universo de 'todos', só reordena) — por isso reaproveita o
// contador de 'todos' em vez de ter entrada própria na RPC.
const SILOS = [
  { key: 'todos',       label: 'Funil padrão' },
  { key: 'minhas',      label: 'Minhas negociações' },
  { key: 'sem_contato', label: 'Sem contato' },
  { key: 'andamento',   label: 'Em andamento' },
  { key: 'recentes',    label: 'Criadas por últimos' },
];

// ─── Componentes auxiliares ────────────────────────────────────
const Spinner = () => (
  <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
);

const BadgeFunil = ({ status, rotulos }) => {
  const f = etapaCrmFunilInfo(status);
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${f.cor}`}>
      {f.emoji} {rotulos[status]}
    </span>
  );
};

const BadgeScore = ({ score }) => {
  const cor = score >= 50 ? 'text-emerald-400' : score >= 20 ? 'text-amber-400' : 'text-muted';
  return <span className={`text-xs font-bold ${cor}`}>⚡ {score} pts</span>;
};

// ─── Modal: Criar/Editar Lead ──────────────────────────────────
// FORM_VAZIO fora do componente: referência estável entre renders, para
// poder entrar na dependência do useEffect abaixo sem causar loop.
const FORM_VAZIO = {
  nome: '', email: '', telefone: '', whatsapp: '', empresa: '', cargo: '',
  origem: 'manual', status_funil: 'lead', forma_aquisicao: '', responsavel_id: '',
  valor_estimado: '', observacoes: '',
  negocio_nome: '', previsao_fechamento: '', campanha: '',
  razao_social: '', documento: '', segmento: '', site: '', porte: '',
  endereco: ENDERECO_VAZIO,
};

export const ModalLead = ({ aberto, onFechar, onSalvar, leadEditando, rotulos, usuariosTenant, usuario }) => {
  const [form, setForm]         = useState(FORM_VAZIO);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro]         = useState('');

  useEffect(() => {
    if (leadEditando) {
      setForm({
        nome:          leadEditando.nome          || '',
        email:         leadEditando.email         || '',
        telefone:      leadEditando.telefone      || '',
        whatsapp:      leadEditando.whatsapp      || '',
        empresa:       leadEditando.empresa       || '',
        cargo:         leadEditando.cargo         || '',
        origem:        leadEditando.origem        || 'manual',
        status_funil:  leadEditando.status_funil  || 'lead',
        forma_aquisicao: leadEditando.forma_aquisicao  || '',
        responsavel_id:  leadEditando.responsavel?.id  || '',
        valor_estimado:leadEditando.valor_estimado|| '',
        observacoes:   leadEditando.observacoes   || '',
        negocio_nome:        leadEditando.negocio_nome        || '',
        previsao_fechamento: leadEditando.previsao_fechamento ? leadEditando.previsao_fechamento.slice(0, 10) : '',
        campanha:            leadEditando.campanha            || '',
        razao_social:  leadEditando.razao_social  || '',
        documento:     leadEditando.documento     || '',
        segmento:      leadEditando.segmento      || '',
        site:          leadEditando.site          || '',
        porte:         leadEditando.porte         || '',
        endereco:      { ...ENDERECO_VAZIO, ...(leadEditando.endereco || {}) },
      });
    } else {
      setForm(FORM_VAZIO);
    }
    setErro('');
  }, [leadEditando, aberto]);

  if (!aberto) return null;

  const set = (campo) => (e) => setForm(f => ({ ...f, [campo]: e.target.value }));
  const setEndereco = (campo) => (e) => setForm(f => ({ ...f, endereco: { ...f.endereco, [campo]: e.target.value } }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nome.trim()) { setErro('Nome é obrigatório.'); return; }
    setSalvando(true);
    setErro('');
    try {
      await onSalvar({
        nome:           form.nome.trim(),
        email:          form.email.trim()    || null,
        telefone:       form.telefone.trim() || null,
        whatsapp:       form.whatsapp.trim() || null,
        empresa:        form.empresa.trim()  || null,
        cargo:          form.cargo.trim()    || null,
        origem:         form.origem,
        status_funil:   form.status_funil,
        forma_aquisicao: form.forma_aquisicao || null,
        responsavel_id:  form.responsavel_id  || null,
        valor_estimado: form.valor_estimado ? Number(form.valor_estimado) : null,
        observacoes:    form.observacoes.trim() || null,
        negocio_nome:        form.negocio_nome.trim() || null,
        previsao_fechamento: form.previsao_fechamento || null,
        campanha:            form.campanha.trim() || null,
        razao_social:   form.razao_social.trim() || null,
        documento:      form.documento.trim()    || null,
        segmento:       form.segmento.trim()     || null,
        site:           form.site.trim()         || null,
        porte:          form.porte || null,
        endereco:       limparEndereco(form.endereco),
      });
      onFechar();
    } catch (err) {
      setErro(err.message || 'Erro ao salvar lead.');
    } finally {
      setSalvando(false);
    }
  };

  const inputStyle = {
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-surface-border)',
    color: 'var(--color-text-primary)',
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="rounded-xl p-6 w-full max-w-lg my-4 border"
        style={{ backgroundColor: 'var(--color-surface-card)', borderColor: 'var(--color-surface-border)' }}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-lg" style={{ color: 'var(--color-text-primary)' }}>
            {leadEditando ? '✏️ Editar Lead' : '🎯 Novo Lead'}
          </h3>
          <button onClick={onFechar} className="text-muted hover:text-white text-lg">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Nome *</label>
              <input type="text" value={form.nome} onChange={set('nome')} placeholder="João Silva"
                className="w-full rounded-lg px-3 py-2 text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                style={inputStyle} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Nome fantasia</label>
              <input type="text" value={form.empresa} onChange={set('empresa')} placeholder="Acme Corp"
                className="w-full rounded-lg px-3 py-2 text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                style={inputStyle} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>E-mail</label>
              <input type="email" value={form.email} onChange={set('email')} placeholder="joao@empresa.com"
                className="w-full rounded-lg px-3 py-2 text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                style={inputStyle} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Telefone</label>
              <input type="text" value={form.telefone} onChange={set('telefone')} placeholder="(11) 99999-9999"
                className="w-full rounded-lg px-3 py-2 text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                style={inputStyle} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <CampoWhatsapp form={form} set={set} inputStyle={inputStyle} />
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Cargo</label>
              <input type="text" value={form.cargo} onChange={set('cargo')} placeholder="CEO"
                className="w-full rounded-lg px-3 py-2 text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                style={inputStyle} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Status no funil</label>
              <select value={form.status_funil} onChange={set('status_funil')}
                className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                style={inputStyle}>
                {ETAPAS_CRM_FUNIL.map(f => <option key={f.key} value={f.key}>{rotulos[f.key]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Origem</label>
              <select value={form.origem} onChange={set('origem')}
                className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                style={inputStyle}>
                {ORIGENS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                Forma de aquisição
                <span
                  title="Outbound: clientes que você foi atrás. Inbound: clientes que vieram até você."
                  style={{ cursor: 'help' }}>
                  ❓
                </span>
              </label>
              <select value={form.forma_aquisicao} onChange={set('forma_aquisicao')}
                className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                style={inputStyle}>
                <option value="">Não informado</option>
                <option value="inbound">Inbound</option>
                <option value="outbound">Outbound</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Responsável</label>
              <select value={form.responsavel_id} onChange={set('responsavel_id')}
                className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                style={inputStyle}>
                <option value="">Eu{usuario?.nome ? ` (${usuario.nome})` : ''}</option>
                {(usuariosTenant || []).map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
              </select>
            </div>
          </div>

          <div className="pt-2 mt-1 border-t" style={{ borderColor: 'var(--color-surface-border)' }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-secondary)' }}>Negócio</p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Valor estimado (R$)</label>
                <input type="number" value={form.valor_estimado} onChange={set('valor_estimado')} placeholder="0,00" min="0" step="0.01"
                  className="w-full rounded-lg px-3 py-2 text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  style={inputStyle} />
              </div>
              <CamposNegocio form={form} set={set} inputStyle={inputStyle} />
            </div>
          </div>

          <div className="pt-2 mt-1 border-t" style={{ borderColor: 'var(--color-surface-border)' }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-secondary)' }}>Empresa</p>
            <div className="space-y-3">
              <CamposEmpresa form={form} set={set} setEndereco={setEndereco} inputStyle={inputStyle} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Observações</label>
            <textarea value={form.observacoes} onChange={set('observacoes')} rows={2} placeholder="Notas sobre o lead..."
              className="w-full rounded-lg px-3 py-2 text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500 resize-none"
              style={inputStyle} />
          </div>

          {erro && <p className="text-red-400 text-xs">{erro}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onFechar}
              className="flex-1 py-2 rounded-lg text-sm transition-colors"
              style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-secondary)' }}>
              Cancelar
            </button>
            <button type="submit" disabled={salvando}
              className="flex-1 bg-primary-600 hover:bg-primary-500 text-white py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Card do Lead (Kanban) ─────────────────────────────────────
const CardLead = ({ lead, onAbrir, selecionado, onToggleSelecao }) => (
  <div
    onClick={() => onAbrir(lead)}
    className="relative rounded-lg p-3 border cursor-pointer hover:border-primary-500/40 transition-all group"
    style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-surface-border)' }}>
    <input
      type="checkbox"
      checked={selecionado}
      onClick={e => e.stopPropagation()}
      onChange={() => onToggleSelecao(lead.id)}
      className="absolute top-2 right-2"
    />
    <div className="flex items-start justify-between gap-2 pr-5">
      <p className="text-sm font-medium group-hover:text-primary-300 transition-colors truncate"
        style={{ color: 'var(--color-text-primary)' }}>
        {lead.nome}
      </p>
      <BadgeScore score={lead.score || 0} />
    </div>
    {lead.empresa && (
      <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--color-text-secondary)' }}>{lead.empresa}</p>
    )}
    <p className="text-xs mt-1 truncate" style={{ color: 'var(--color-text-secondary)' }}>
      👤 {lead.responsavel?.nome || 'Sem responsável'}
    </p>
    <div className="flex items-center justify-between mt-2">
      {lead.valor_estimado ? (
        <span className="text-xs text-emerald-400">{formatarMoeda(lead.valor_estimado)}</span>
      ) : (
        <span />
      )}
      <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
        {tempoRelativo(lead.criado_em)}
      </span>
    </div>
  </div>
);

// ─── Coluna do Kanban ──────────────────────────────────────────
const ColunaKanban = ({ funil, rotulo, leads, onAbrir, selecionados, onToggleSelecao }) => (
  <div className="flex-shrink-0 w-64">
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <span>{funil.emoji}</span>
        <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{rotulo}</span>
      </div>
      <span className="text-xs px-2 py-0.5 rounded-full"
        style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-secondary)' }}>
        {leads.length}
      </span>
    </div>
    <div className="space-y-2 min-h-24">
      {leads.map(lead => (
        <CardLead key={lead.id} lead={lead} onAbrir={onAbrir}
          selecionado={selecionados.has(lead.id)} onToggleSelecao={onToggleSelecao} />
      ))}
      {leads.length === 0 && (
        <div className="rounded-lg border-2 border-dashed p-4 text-center"
          style={{ borderColor: 'var(--color-surface-border)' }}>
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Nenhum lead</p>
        </div>
      )}
    </div>
  </div>
);

// ─── Linha da lista ────────────────────────────────────────────
const LinhaLead = ({ lead, onAbrir, onEditar, onExcluir, rotulos, selecionado, onToggleSelecao }) => (
  <tr className="border-b hover:bg-white/5 transition-colors cursor-pointer"
    style={{ borderColor: 'var(--color-surface-border)' }}
    onClick={() => onAbrir(lead)}>
    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
      <input type="checkbox" checked={selecionado} onChange={() => onToggleSelecao(lead.id)} />
    </td>
    <td className="px-4 py-3">
      <div>
        <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{lead.nome}</p>
        {lead.empresa && <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{lead.empresa}</p>}
      </div>
    </td>
    <td className="px-4 py-3"><BadgeFunil status={lead.status_funil} rotulos={rotulos} /></td>
    <td className="px-4 py-3"><BadgeScore score={lead.score || 0} /></td>
    <td className="px-4 py-3">
      <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
        {lead.valor_estimado ? formatarMoeda(lead.valor_estimado) : '—'}
      </span>
    </td>
    <td className="px-4 py-3">
      <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
        {origemInfo(lead.origem).label}
      </span>
    </td>
    <td className="px-4 py-3">
      <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
        {lead.responsavel?.nome || '—'}
      </span>
    </td>
    <td className="px-4 py-3">
      <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
        {tempoRelativo(lead.criado_em)}
      </span>
    </td>
    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
      <div className="flex gap-2">
        <button onClick={() => onEditar(lead)} className="text-muted hover:text-primary-400 transition-colors text-sm">✏️</button>
        <PermissaoGuarda permissao="crm.excluir"><button onClick={() => onExcluir(lead.id)} className="text-muted hover:text-red-400 transition-colors text-sm">🗑️</button></PermissaoGuarda>
      </div>
    </td>
  </tr>
);

// ─── Modal simples de ação em massa (Transferir/Status/Mover) ──
const ModalAcaoMassa = ({ titulo, onFechar, children }) => (
  <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onFechar}>
    <div onClick={e => e.stopPropagation()}
      className="rounded-xl p-5 w-full max-w-sm border"
      style={{ backgroundColor: 'var(--color-surface-card)', borderColor: 'var(--color-surface-border)' }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-base" style={{ color: 'var(--color-text-primary)' }}>{titulo}</h3>
        <button onClick={onFechar} className="text-muted hover:text-white text-lg">✕</button>
      </div>
      {children}
    </div>
  </div>
);

// ─── Página Principal: Leads ───────────────────────────────────
const PaginaLeads = () => {
  const navigate = useNavigate();
  const { usuario } = useAuthStore();
  const { listarTimes } = useOrg();
  const {
    leads, carregando, erro,
    carregar, criar, atualizar, excluir, excluirEmMassa,
    mudarStatus, moverParaTime, contarSilos,
  } = useLeads();

  const [modalAberto, setModalAberto]   = useState(false);
  const [leadEditando, setLeadEditando] = useState(null);
  const [busca, setBusca]               = useState('');
  const [vista, setVista]               = useState('kanban');
  const [modalRotulosAberto, setModalRotulosAberto] = useState(false);
  const [silo, setSilo]                 = useState('todos');
  const [responsavelFiltro, setResponsavelFiltro] = useState('');
  const [usuariosTenant, setUsuariosTenant] = useState([]);
  const [times, setTimes] = useState([]);
  const [contadores, setContadores] = useState({ todos: 0, minhas: 0, sem_contato: 0, andamento: 0 });
  const { rotulos, recarregar: recarregarRotulos } = useRotulosStatus('crm_funil');

  // Seleção múltipla / ações em massa
  const [selecionados, setSelecionados] = useState(new Set());
  const [modalTransferir, setModalTransferir] = useState(false);
  const [modalStatus, setModalStatus]         = useState(false);
  const [modalMover, setModalMover]           = useState(false);
  const [processandoMassa, setProcessandoMassa] = useState(false);
  const [resultadoMassa, setResultadoMassa]   = useState('');
  const [valorTransferir, setValorTransferir] = useState('');
  const [valorStatus, setValorStatus]         = useState(ETAPAS_CRM_FUNIL[0].key);
  const [valorMover, setValorMover]           = useState('');

  const abrirDetalhe = (lead) => navigate(`/crm/leads/${lead.id}`);

  useEffect(() => {
    carregar({ silo, responsavel_id: responsavelFiltro || undefined });
  }, [carregar, silo, responsavelFiltro]);

  // Contadores dos silos: independentes do filtro ativo (ver useCRM.js),
  // carregados uma vez — trocar de silo não deve zerar os outros tiles.
  useEffect(() => { contarSilos().then(setContadores); }, [contarSilos]);
  const atualizarContadores = () => contarSilos().then(setContadores);

  useEffect(() => {
    if (!usuario?.tenant_id) return;
    supabase.from('users').select('id, nome').eq('tenant_id', usuario.tenant_id)
      .then(({ data, error }) => { if (!error) setUsuariosTenant(data || []); });
  }, [usuario?.tenant_id]);

  const leadsFiltrados = leads.filter(l =>
    !busca ||
    l.nome.toLowerCase().includes(busca.toLowerCase()) ||
    (l.empresa || '').toLowerCase().includes(busca.toLowerCase())
  );

  const handleSalvar = async (dados) => {
    if (leadEditando) {
      await atualizar(leadEditando.id, dados);
    } else {
      await criar(dados);
    }
    setLeadEditando(null);
  };

  const handleEditar = (lead) => {
    setLeadEditando(lead);
    setModalAberto(true);
  };

  const handleExcluir = async (id) => {
    if (!window.confirm('Excluir este lead?')) return;
    await excluir(id);
  };

  // ─── Seleção múltipla ──────────────────────────────────────────
  const toggleSelecao = (id) => {
    setSelecionados(prev => {
      const novo = new Set(prev);
      if (novo.has(id)) novo.delete(id); else novo.add(id);
      return novo;
    });
  };

  const toggleSelecionarTodos = () => {
    setSelecionados(prev =>
      prev.size === leadsFiltrados.length ? new Set() : new Set(leadsFiltrados.map(l => l.id))
    );
  };

  const limparSelecao = () => setSelecionados(new Set());

  const finalizarAcaoMassa = async (mensagem) => {
    setResultadoMassa(mensagem);
    limparSelecao();
    await carregar({ silo, responsavel_id: responsavelFiltro || undefined });
    await atualizarContadores();
  };

  const handleTransferirEmMassa = async (novoResponsavelId) => {
    setProcessandoMassa(true);
    try {
      const ids = [...selecionados];
      const resultados = await Promise.allSettled(ids.map(id => atualizar(id, { responsavel_id: novoResponsavelId || null })));
      const falhas = resultados.filter(r => r.status === 'rejected').length;
      setModalTransferir(false);
      await finalizarAcaoMassa(`${ids.length - falhas} transferido(s)${falhas ? ` · ${falhas} falharam` : ''}.`);
    } finally {
      setProcessandoMassa(false);
    }
  };

  const handleAlterarStatusEmMassa = async (novoStatus) => {
    setProcessandoMassa(true);
    try {
      const ids = [...selecionados];
      const resultados = await Promise.allSettled(ids.map(id => mudarStatus(id, novoStatus)));
      const falhas = resultados.filter(r => r.status === 'rejected').length;
      setModalStatus(false);
      await finalizarAcaoMassa(`${ids.length - falhas} atualizado(s)${falhas ? ` · ${falhas} falharam` : ''}.`);
    } finally {
      setProcessandoMassa(false);
    }
  };

  const handleMoverEmMassa = async (novoTimeId) => {
    setProcessandoMassa(true);
    try {
      const ids = [...selecionados];
      const resultados = await Promise.allSettled(ids.map(id => moverParaTime(id, novoTimeId || null)));
      const falhas = resultados.filter(r => r.status === 'rejected').length;
      setModalMover(false);
      await finalizarAcaoMassa(`${ids.length - falhas} movido(s)${falhas ? ` · ${falhas} falharam` : ''}.`);
    } finally {
      setProcessandoMassa(false);
    }
  };

  const handleExcluirEmMassa = async () => {
    const ids = [...selecionados];
    if (!window.confirm(`Excluir ${ids.length} lead(s)?`)) return;
    setProcessandoMassa(true);
    try {
      const { excluidosIds, ignorados } = await excluirEmMassa(ids);
      await finalizarAcaoMassa(
        `${excluidosIds.length} excluído(s)` + (ignorados > 0 ? ` · ${ignorados} ignorado(s) por falta de permissão.` : '.')
      );
    } finally {
      setProcessandoMassa(false);
    }
  };

  const handleExportarCsv = () => {
    const linhas = leadsFiltrados.filter(l => selecionados.has(l.id));
    const cabecalho = ['Nome', 'Empresa', 'Email', 'Telefone', 'Status', 'Score', 'Valor estimado', 'Responsável', 'Origem', 'Criado em'];
    const escapar = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const linhasCsv = linhas.map(l => [
      l.nome, l.empresa, l.email, l.telefone,
      rotulos[l.status_funil], l.score, l.valor_estimado,
      l.responsavel?.nome, origemInfo(l.origem).label, formatarData(l.criado_em),
    ].map(escapar).join(','));
    const csv = [cabecalho.map(escapar).join(','), ...linhasCsv].join('\r\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const abrirModalMover = () => {
    listarTimes().then(setTimes).catch(() => setTimes([]));
    setModalMover(true);
  };

  // Agrupar por status_funil para o Kanban
  const kanban = ETAPAS_CRM_FUNIL.reduce((acc, f) => {
    acc[f.key] = leadsFiltrados.filter(l => l.status_funil === f.key);
    return acc;
  }, {});

  const totalScore = leads.reduce((s, l) => s + (l.score || 0), 0);

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            🎯 Leads
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
            {leads.length} leads · Score total: ⚡ {totalScore} pts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setModalRotulosAberto(true)}
            className="text-muted hover:text-primary-400 transition-colors text-lg p-2"
            title="Personalizar rótulos do funil">
            ⚙️
          </button>
          <button
            onClick={() => { setLeadEditando(null); setModalAberto(true); }}
            className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
            + Novo Lead
          </button>
        </div>
      </div>

      {/* Silos de filtro rápido */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {SILOS.map(({ key, label }) => {
          const ativo = silo === key;
          const contagem = key === 'recentes' ? contadores.todos : contadores[key];
          return (
            <button key={key}
              onClick={() => setSilo(ativo ? 'todos' : key)}
              className="rounded-xl p-3 text-center border transition-all"
              style={{
                backgroundColor: ativo ? 'rgba(99,102,241,0.1)' : 'var(--color-surface-card)',
                borderColor: ativo ? 'var(--color-primary-500)' : 'var(--color-surface-border)',
              }}>
              <p className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>{contagem ?? 0}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>{label}</p>
            </button>
          );
        })}
      </div>

      {/* Filtros e controles */}
      <div className="flex items-center gap-3 flex-wrap">
        <input
          type="text"
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="Buscar por nome ou empresa..."
          className="flex-1 min-w-48 rounded-lg px-3 py-2 text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          style={{ backgroundColor: 'var(--color-surface-card)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-primary)' }}
        />
        <select
          value={responsavelFiltro}
          onChange={e => setResponsavelFiltro(e.target.value)}
          className="rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
          style={{ backgroundColor: 'var(--color-surface-card)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-primary)' }}>
          <option value="">Todos os responsáveis</option>
          {usuariosTenant.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
        </select>
        <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: 'var(--color-surface-border)' }}>
          <button onClick={() => setVista('kanban')}
            className={`px-3 py-2 text-sm transition-colors ${vista === 'kanban' ? 'bg-primary-600 text-white' : 'text-muted hover:text-white'}`}
            style={vista !== 'kanban' ? { backgroundColor: 'var(--color-surface-card)' } : {}}>
            🗂️ Kanban
          </button>
          <button onClick={() => setVista('lista')}
            className={`px-3 py-2 text-sm transition-colors ${vista === 'lista' ? 'bg-primary-600 text-white' : 'text-muted hover:text-white'}`}
            style={vista !== 'lista' ? { backgroundColor: 'var(--color-surface-card)' } : {}}>
            📋 Lista
          </button>
        </div>
      </div>

      {/* Erro */}
      {erro && (
        <div className="rounded-lg p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{erro}</div>
      )}

      {/* Resultado de ação em massa */}
      {resultadoMassa && (
        <div className="rounded-lg p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm flex items-center justify-between gap-3">
          <span>{resultadoMassa}</span>
          <button onClick={() => setResultadoMassa('')} className="text-emerald-300/70 hover:text-emerald-300">✕</button>
        </div>
      )}

      {/* Barra de ações em massa */}
      {selecionados.size > 0 && (
        <div className="sticky top-0 z-10 flex items-center gap-2 flex-wrap rounded-lg p-3 border"
          style={{ backgroundColor: 'var(--color-surface-card)', borderColor: 'var(--color-primary-500)' }}>
          <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
            {selecionados.size} selecionado(s)
          </span>
          <PermissaoGuarda permissao="crm.editar">
            <>
              <button onClick={() => setModalTransferir(true)} disabled={processandoMassa}
                className="text-xs px-3 py-1.5 rounded-lg border text-muted hover:text-white transition-colors" style={{ borderColor: 'var(--color-surface-border)' }}>
                👤 Transferir
              </button>
              <button onClick={() => setModalStatus(true)} disabled={processandoMassa}
                className="text-xs px-3 py-1.5 rounded-lg border text-muted hover:text-white transition-colors" style={{ borderColor: 'var(--color-surface-border)' }}>
                🔀 Alterar status
              </button>
              <button onClick={abrirModalMover} disabled={processandoMassa}
                className="text-xs px-3 py-1.5 rounded-lg border text-muted hover:text-white transition-colors" style={{ borderColor: 'var(--color-surface-border)' }}>
                📤 Mover
              </button>
            </>
          </PermissaoGuarda>
          <button onClick={handleExportarCsv}
            className="text-xs px-3 py-1.5 rounded-lg border text-muted hover:text-white transition-colors" style={{ borderColor: 'var(--color-surface-border)' }}>
            ⬇️ Exportar CSV
          </button>
          <PermissaoGuarda permissao="crm.excluir">
            <button onClick={handleExcluirEmMassa} disabled={processandoMassa}
              className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 hover:bg-red-500/20 transition-colors">
              🗑️ Excluir
            </button>
          </PermissaoGuarda>
          <button onClick={limparSelecao} className="ml-auto text-xs text-muted hover:text-white transition-colors">
            Cancelar
          </button>
        </div>
      )}

      {/* Carregando */}
      {carregando && (
        <div className="flex justify-center py-12"><Spinner /></div>
      )}

      {/* Vista Kanban */}
      {!carregando && vista === 'kanban' && (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {ETAPAS_CRM_FUNIL.map(f => (
              <ColunaKanban key={f.key} funil={f} rotulo={rotulos[f.key]} leads={kanban[f.key] || []}
                onAbrir={abrirDetalhe} selecionados={selecionados} onToggleSelecao={toggleSelecao} />
            ))}
          </div>
        </div>
      )}

      {/* Vista Lista */}
      {!carregando && vista === 'lista' && (
        <div className="rounded-xl border overflow-hidden"
          style={{ backgroundColor: 'var(--color-surface-card)', borderColor: 'var(--color-surface-border)' }}>
          {leadsFiltrados.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-4xl mb-3">🎯</p>
              <p className="font-medium" style={{ color: 'var(--color-text-primary)' }}>Nenhum lead encontrado</p>
              <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                {busca ? 'Tente outro termo de busca.' : 'Crie seu primeiro lead clicando em "+ Novo Lead".'}
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--color-surface-border)' }}>
                  <th className="px-4 py-3 text-left">
                    <input type="checkbox"
                      checked={selecionados.size > 0 && selecionados.size === leadsFiltrados.length}
                      onChange={toggleSelecionarTodos} />
                  </th>
                  {['Nome', 'Status', 'Score', 'Valor', 'Origem', 'Responsável', 'Criado', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                      style={{ color: 'var(--color-text-secondary)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leadsFiltrados.map(lead => (
                  <LinhaLead
                    key={lead.id}
                    lead={lead}
                    onAbrir={abrirDetalhe}
                    onEditar={handleEditar}
                    onExcluir={handleExcluir}
                    rotulos={rotulos}
                    selecionado={selecionados.has(lead.id)}
                    onToggleSelecao={toggleSelecao}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Modal criar/editar */}
      <ModalLead
        aberto={modalAberto}
        onFechar={() => { setModalAberto(false); setLeadEditando(null); }}
        onSalvar={handleSalvar}
        leadEditando={leadEditando}
        rotulos={rotulos}
        usuariosTenant={usuariosTenant}
        usuario={usuario}
      />

      {/* Ações em massa: Transferir responsável */}
      {modalTransferir && (
        <ModalAcaoMassa titulo="Transferir responsável" onFechar={() => setModalTransferir(false)}>
          <select value={valorTransferir} onChange={e => setValorTransferir(e.target.value)}
            className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 mb-3"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-primary)' }}>
            <option value="">Sem responsável</option>
            {usuariosTenant.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
          </select>
          <button disabled={processandoMassa}
            onClick={() => handleTransferirEmMassa(valorTransferir)}
            className="w-full bg-primary-600 hover:bg-primary-500 text-white py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
            {processandoMassa ? 'Processando...' : 'Confirmar'}
          </button>
        </ModalAcaoMassa>
      )}

      {/* Ações em massa: Alterar status */}
      {modalStatus && (
        <ModalAcaoMassa titulo="Alterar status" onFechar={() => setModalStatus(false)}>
          <select value={valorStatus} onChange={e => setValorStatus(e.target.value)}
            className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 mb-3"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-primary)' }}>
            {ETAPAS_CRM_FUNIL.map(f => <option key={f.key} value={f.key}>{rotulos[f.key]}</option>)}
          </select>
          <button disabled={processandoMassa}
            onClick={() => handleAlterarStatusEmMassa(valorStatus)}
            className="w-full bg-primary-600 hover:bg-primary-500 text-white py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
            {processandoMassa ? 'Processando...' : 'Confirmar'}
          </button>
        </ModalAcaoMassa>
      )}

      {/* Ações em massa: Mover de time */}
      {modalMover && (
        <ModalAcaoMassa titulo="Mover para outro time" onFechar={() => setModalMover(false)}>
          <select value={valorMover} onChange={e => setValorMover(e.target.value)}
            className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 mb-3"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-primary)' }}>
            <option value="">Sem time</option>
            {times.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
          </select>
          <button disabled={processandoMassa}
            onClick={() => handleMoverEmMassa(valorMover)}
            className="w-full bg-primary-600 hover:bg-primary-500 text-white py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
            {processandoMassa ? 'Processando...' : 'Confirmar'}
          </button>
        </ModalAcaoMassa>
      )}

      <ModalRotulosStatus
        aberto={modalRotulosAberto}
        onFechar={() => { setModalRotulosAberto(false); recarregarRotulos(); }}
        dominio="crm_funil"
      />
    </div>
  );
};

export default PaginaLeads;