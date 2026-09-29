// =============================================================
// PRANCHETO.IA - PÁGINA CHEIA DE CONTATO (Lead ou Cliente)
// Substitui os antigos painéis modais (PainelLead/PainelCliente).
// Compartilhada entre /crm/leads/:id e /crm/clientes/:id — o que muda
// entre Lead e Cliente é só o valor de contato.tipo_registro, não um
// componente diferente.
// =============================================================

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore.js';
import {
  useContato, useInteracoes, useDocumentos, useCamposCustom,
  TIPOS_INTERACAO, tipoInfo, origemInfo,
  formatarMoeda, formatarData, formatarDataHora, tempoRelativo,
} from '../../hooks/useCRM.js';
import { useOrg } from '../../hooks/useOrg.js';
import { useRotulosStatus, ETAPAS_CRM_FUNIL, etapaCrmFunilInfo } from '../../hooks/useRotulosStatus.js';
import { usePermission } from '../../hooks/usePermission.js';
import PermissaoGuarda from '../../components/ui/PermissaoGuarda.jsx';
import {
  PORTE_LABEL, formatarEndereco, temInformacoesExtras,
} from '../../components/crm/CamposContatoExtras.jsx';
import { ModalLead } from './Leads.jsx';
import { ModalCliente } from './Clientes.jsx';

const FORMA_AQUISICAO_LABEL = { inbound: 'Inbound', outbound: 'Outbound' };

const Spinner = () => (
  <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
);

const ABAS = [
  { key: 'detalhes',  label: 'ℹ️ Detalhes'   },
  { key: 'historico', label: '📝 Histórico'  },
  { key: 'arquivos',  label: '📎 Arquivos'   },
];

const TIPOS_DOCUMENTO = [
  { key: 'contrato', label: 'Contrato' },
  { key: 'proposta', label: 'Proposta' },
  { key: 'nf',       label: 'Nota fiscal' },
  { key: 'outro',    label: 'Outro' },
];

const emojiDocumento = (tipo) =>
  tipo === 'contrato' ? '📜' : tipo === 'proposta' ? '📄' : tipo === 'nf' ? '🧾' : '📎';

// ─── Modal simples: nova anotação (atalho flutuante) ────────────
const ModalNota = ({ aberto, onFechar, onSalvar }) => {
  const [texto, setTexto] = useState('');
  const [salvando, setSalvando] = useState(false);

  if (!aberto) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!texto.trim()) return;
    setSalvando(true);
    try {
      await onSalvar(texto.trim());
      setTexto('');
      onFechar();
    } catch { /* silencioso */ }
    finally { setSalvando(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onFechar}>
      <form onSubmit={handleSubmit} onClick={e => e.stopPropagation()}
        className="rounded-xl p-5 w-full max-w-md border"
        style={{ backgroundColor: 'var(--color-surface-card)', borderColor: 'var(--color-surface-border)' }}>
        <h3 className="font-semibold text-lg mb-3" style={{ color: 'var(--color-text-primary)' }}>📝 Criar anotação</h3>
        <textarea
          value={texto}
          onChange={e => setTexto(e.target.value)}
          rows={4}
          autoFocus
          placeholder="Escreva sua anotação..."
          className="w-full rounded-lg px-3 py-2 text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500 resize-none"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-primary)' }}
        />
        <div className="flex gap-3 pt-3">
          <button type="button" onClick={onFechar}
            className="flex-1 py-2 rounded-lg text-sm transition-colors"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-secondary)' }}>
            Cancelar
          </button>
          <button type="submit" disabled={salvando || !texto.trim()}
            className="flex-1 bg-primary-600 hover:bg-primary-500 text-white py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
            {salvando ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </div>
  );
};

const DetalheContato = ({ voltar }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const usuario = useAuthStore(s => s.usuario);
  const { pode } = usePermission();
  const { listarUsuariosTenant } = useOrg();
  const { rotulos } = useRotulosStatus('crm_funil');

  const {
    contato, carregando, erro,
    atualizar, mudarStatus, converterParaCliente, excluir,
  } = useContato(id);
  const { interacoes, carregando: carregandoInt, carregar: carregarInt, adicionar: adicionarInteracao } = useInteracoes(id);
  const { documentos, carregando: carregandoDoc, carregar: carregarDoc, adicionar: adicionarDoc, baixar, excluir: removerDoc } = useDocumentos(id);
  const { buscarValores } = useCamposCustom();

  const [aba, setAba] = useState('detalhes');
  const [usuariosTenant, setUsuariosTenant] = useState([]);
  const [valoresCampos, setValoresCampos] = useState([]);
  const [carregandoCampos, setCarregandoCampos] = useState(true);
  const [modalEditarAberto, setModalEditarAberto] = useState(false);
  const [modalNotaAberto, setModalNotaAberto] = useState(false);
  const [confirmarConversao, setConfirmarConversao] = useState(false);
  const [convertendo, setConvertendo] = useState(false);
  const [erroAcao, setErroAcao] = useState('');

  const [novaInteracao, setNovaInteracao] = useState('');
  const [tipoInteracao, setTipoInteracao] = useState('nota');
  const [enviandoInteracao, setEnviandoInteracao] = useState(false);

  const [arquivoEscolhido, setArquivoEscolhido] = useState(null);
  const [tipoDocumento, setTipoDocumento] = useState('outro');
  const [enviandoArquivo, setEnviandoArquivo] = useState(false);

  useEffect(() => { if (id) { carregarInt(); carregarDoc(); } }, [id, carregarInt, carregarDoc]);

  useEffect(() => {
    if (!id) return;
    setCarregandoCampos(true);
    buscarValores(id)
      .then(setValoresCampos)
      .catch(() => setValoresCampos([]))
      .finally(() => setCarregandoCampos(false));
  }, [id, buscarValores]);

  useEffect(() => {
    listarUsuariosTenant().then(setUsuariosTenant).catch(() => setUsuariosTenant([]));
  }, [listarUsuariosTenant]);

  if (carregando) {
    return <div className="flex justify-center py-16"><Spinner /></div>;
  }

  if (!contato) {
    return (
      <div className="text-center py-16 opacity-60">
        <p className="text-4xl mb-3">🔍</p>
        <p style={{ color: 'var(--color-text-secondary)' }}>{erro || 'Contato não encontrado.'}</p>
        <button onClick={() => navigate(voltar)} className="mt-3 text-sm text-primary-400 hover:underline">
          ← Voltar
        </button>
      </div>
    );
  }

  const ehLead = contato.tipo_registro === 'lead';
  const ModalEdicao = ehLead ? ModalLead : ModalCliente;

  // Agrupa valores de campos customizados por time e detecta labels
  // duplicados entre times, pra exibir "label (NomeDoTime)" quando
  // necessário — lógica portada de CRM.jsx (única implementação existente
  // de leitura de campos customizados no app).
  const camposComNamespace = (() => {
    if (!valoresCampos.length) return [];
    const contagemLabel = {};
    valoresCampos.forEach(v => {
      const label = v.campo?.label || v.campo?.nome || '';
      contagemLabel[label] = (contagemLabel[label] || 0) + 1;
    });
    return valoresCampos
      .filter(v => v.valor != null || v.valor_json != null)
      .map(v => {
        const label = v.campo?.label || v.campo?.nome || 'Campo';
        const nomeTime = v.campo?.time_id ? (v.campo?.time?.nome || null) : null;
        const temConflito = contagemLabel[label] > 1;
        return { ...v, labelExibido: temConflito && nomeTime ? `${label} (${nomeTime})` : label, nomeTime };
      })
      .sort((a, b) => {
        const aDoTime = a.campo?.time_id === contato.time_id ? 0 : 1;
        const bDoTime = b.campo?.time_id === contato.time_id ? 0 : 1;
        return aDoTime - bDoTime;
      });
  })();

  const handleMudarStatus = async (novoStatus) => {
    setErroAcao('');
    try { await mudarStatus(novoStatus); }
    catch (err) { setErroAcao(err.message || 'Erro ao mudar status.'); }
  };

  const handleConverter = async () => {
    setConvertendo(true);
    setErroAcao('');
    try {
      await converterParaCliente();
      navigate(`/crm/clientes/${id}`, { replace: true });
    } catch (err) {
      setErroAcao(err.message || 'Erro ao converter o lead em cliente.');
    } finally {
      setConvertendo(false);
    }
  };

  const handleExcluir = async () => {
    if (!window.confirm(`Excluir ${ehLead ? 'este lead' : 'este cliente'}?`)) return;
    try {
      await excluir();
      navigate(voltar);
    } catch (err) {
      setErroAcao(err.message || 'Erro ao excluir.');
    }
  };

  const handleSalvarEdicao = async (dados) => {
    await atualizar(dados);
    setModalEditarAberto(false);
  };

  const handleResponsavelChange = async (e) => {
    try { await atualizar({ responsavel_id: e.target.value || null }); }
    catch (err) { setErroAcao(err.message || 'Erro ao trocar responsável.'); }
  };

  const handleNovaInteracao = async (e) => {
    e.preventDefault();
    if (!novaInteracao.trim()) return;
    setEnviandoInteracao(true);
    try {
      await adicionarInteracao(tipoInteracao, novaInteracao.trim());
      setNovaInteracao('');
    } catch { /* silencioso */ }
    finally { setEnviandoInteracao(false); }
  };

  const handleUploadArquivo = async (e) => {
    e.preventDefault();
    if (!arquivoEscolhido) return;
    setEnviandoArquivo(true);
    try {
      await adicionarDoc({ arquivo: arquivoEscolhido, tipo: tipoDocumento });
      setArquivoEscolhido(null);
    } catch (err) {
      setErroAcao(err.message || 'Erro ao enviar arquivo.');
    } finally {
      setEnviandoArquivo(false);
    }
  };

  const handleRemoverDoc = async (doc) => {
    if (!window.confirm(`Remover o arquivo "${doc.nome}"?`)) return;
    try { await removerDoc(doc); }
    catch (err) { setErroAcao(err.message || 'Erro ao remover arquivo.'); }
  };

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-4xl mx-auto pb-24">
      <button onClick={() => navigate(voltar)} className="text-sm text-primary-400 hover:underline">
        ← Voltar
      </button>

      {/* Header */}
      <div className="rounded-xl border p-5" style={{ backgroundColor: 'var(--color-surface-card)', borderColor: 'var(--color-surface-border)' }}>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-bold text-xl" style={{ color: 'var(--color-text-primary)' }}>{contato.nome}</h1>
              {ehLead ? (
                <span className={`text-xs px-2 py-0.5 rounded-full border ${etapaCrmFunilInfo(contato.status_funil).cor}`}>
                  {etapaCrmFunilInfo(contato.status_funil).emoji} {rotulos[contato.status_funil]}
                </span>
              ) : (
                <span className="text-xs px-2 py-0.5 rounded-full border bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                  ✅ Cliente
                </span>
              )}
              <span className="text-xs font-bold text-amber-400">⚡ {contato.score || 0} pts</span>
            </div>
            {(contato.negocio_nome || contato.empresa) && (
              <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                {contato.negocio_nome || contato.empresa}
              </p>
            )}
            <div className="flex gap-3 mt-2 flex-wrap items-center">
              {contato.email    && <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>✉️ {contato.email}</span>}
              {contato.telefone && <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>📞 {contato.telefone}</span>}
              {contato.valor_estimado && (
                <span className="text-xs text-emerald-400">💰 {formatarMoeda(contato.valor_estimado)}</span>
              )}
              {pode('crm.editar') ? (
                <select
                  value={contato.responsavel?.id || ''}
                  onChange={handleResponsavelChange}
                  className="text-xs rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-primary)' }}>
                  <option value="">Sem responsável</option>
                  {usuariosTenant.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
                </select>
              ) : (
                <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  👤 {contato.responsavel?.nome || 'Sem responsável'}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={() => setModalEditarAberto(true)} className="text-muted hover:text-primary-400 transition-colors" title="Editar">✏️</button>
            <PermissaoGuarda permissao="crm.excluir">
              <button onClick={handleExcluir} className="text-muted hover:text-red-400 transition-colors" title="Excluir">🗑️</button>
            </PermissaoGuarda>
          </div>
        </div>

        {/* Mover no funil + converter — só faz sentido enquanto Lead */}
        {ehLead && (
          <>
            <div className="mt-4 pt-4 border-t flex gap-2 flex-wrap items-center" style={{ borderColor: 'var(--color-surface-border)' }}>
              <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Mover para:</span>
              {ETAPAS_CRM_FUNIL.map(f => (
                <button key={f.key}
                  onClick={() => handleMudarStatus(f.key)}
                  disabled={f.key === contato.status_funil}
                  className={`text-xs px-2 py-1 rounded-full border transition-all ${f.cor} ${f.key === contato.status_funil ? 'opacity-100 ring-1 ring-white/20' : 'opacity-50 hover:opacity-100'}`}>
                  {f.emoji} {rotulos[f.key]}
                </button>
              ))}
            </div>

            <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--color-surface-border)' }}>
              {!confirmarConversao ? (
                <button onClick={() => setConfirmarConversao(true)}
                  className="w-full py-2.5 rounded-lg text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors">
                  🎉 Converter para Cliente
                </button>
              ) : (
                <div className="flex items-center gap-3 flex-wrap">
                  <p className="text-sm text-emerald-300 flex-1">Confirmar conversão para Cliente?</p>
                  <button onClick={() => setConfirmarConversao(false)}
                    className="text-xs px-3 py-1.5 rounded-lg border text-muted" style={{ borderColor: 'var(--color-surface-border)' }}>
                    Cancelar
                  </button>
                  <button onClick={handleConverter} disabled={convertendo}
                    className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium disabled:opacity-50">
                    {convertendo ? 'Convertendo...' : 'Confirmar'}
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {erroAcao && <p className="text-red-400 text-xs mt-3">{erroAcao}</p>}
      </div>

      {/* Abas */}
      <div className="flex border-b" style={{ borderColor: 'var(--color-surface-border)' }}>
        {ABAS.map(a => (
          <button key={a.key} onClick={() => setAba(a.key)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${aba === a.key ? 'border-primary-500 text-primary-300' : 'border-transparent text-muted hover:text-white'}`}>
            {a.label}
          </button>
        ))}
      </div>

      {/* Aba: Detalhes */}
      {aba === 'detalhes' && (
        <div className="rounded-xl border p-5 space-y-4" style={{ backgroundColor: 'var(--color-surface-card)', borderColor: 'var(--color-surface-border)' }}>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Origem',          valor: origemInfo(contato.origem).label },
              { label: 'Cargo',           valor: contato.cargo || '—' },
              { label: 'Forma de aquisição', valor: FORMA_AQUISICAO_LABEL[contato.forma_aquisicao] || 'Não informado' },
              { label: ehLead ? 'Criado em' : 'Cliente desde', valor: formatarData(contato.criado_em) },
              ...(ehLead ? [] : [
                { label: 'LTV',              valor: formatarMoeda(contato.ltv || 0) },
                { label: 'Convertido em',    valor: formatarDataHora(contato.convertido_em) },
                { label: 'Início contrato',  valor: formatarData(contato.data_inicio_contrato) },
                { label: 'Fim contrato',     valor: formatarData(contato.data_fim_contrato) },
              ]),
            ].map(({ label, valor }) => (
              <div key={label}>
                <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--color-text-secondary)' }}>{label}</p>
                <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>{valor}</p>
              </div>
            ))}
          </div>

          {contato.observacoes && (
            <div>
              <p className="text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Observações</p>
              <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>{contato.observacoes}</p>
            </div>
          )}

          {temInformacoesExtras(contato) && (
            <div className="pt-3 border-t" style={{ borderColor: 'var(--color-surface-border)' }}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                Mais informações
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Negócio',                valor: contato.negocio_nome },
                  { label: 'Campanha',               valor: contato.campanha },
                  { label: 'Previsão de fechamento',  valor: contato.previsao_fechamento ? formatarData(contato.previsao_fechamento) : null },
                  { label: 'WhatsApp',                valor: contato.whatsapp },
                  { label: 'Razão social',            valor: contato.razao_social },
                  { label: 'CNPJ/CPF',                valor: contato.documento },
                  { label: 'Segmento',                valor: contato.segmento },
                  { label: 'Porte',                   valor: PORTE_LABEL[contato.porte] },
                  { label: 'Site',                    valor: contato.site },
                  { label: 'Endereço',                valor: formatarEndereco(contato.endereco) },
                ].filter(({ valor }) => valor).map(({ label, valor }) => (
                  <div key={label}>
                    <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--color-text-secondary)' }}>{label}</p>
                    <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>{valor}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(carregandoCampos || camposComNamespace.length > 0) && (
            <div className="pt-3 border-t" style={{ borderColor: 'var(--color-surface-border)' }}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                Campos customizados
              </p>
              {carregandoCampos ? (
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Carregando...</p>
              ) : (
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  {camposComNamespace.map(v => (
                    <div key={v.id} className="min-w-0">
                      <span className="text-xs block truncate" style={{ color: 'var(--color-text-secondary)' }} title={v.labelExibido}>
                        {v.labelExibido}
                        {v.nomeTime && v.campo?.time_id !== contato.time_id && (
                          <span className="ml-1 px-1 py-0.5 rounded text-[10px]"
                            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-surface-border)' }}>
                            {v.nomeTime}
                          </span>
                        )}
                      </span>
                      <span className="text-sm font-medium truncate block" style={{ color: 'var(--color-text-primary)' }}>
                        {v.valor_json != null
                          ? (Array.isArray(v.valor_json) ? v.valor_json.join(', ') : JSON.stringify(v.valor_json))
                          : (v.valor || '—')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Aba: Histórico */}
      {aba === 'historico' && (
        <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: 'var(--color-surface-card)', borderColor: 'var(--color-surface-border)' }}>
          <div className="p-5 space-y-3">
            {carregandoInt ? (
              <div className="flex justify-center py-4"><Spinner /></div>
            ) : interacoes.length === 0 ? (
              <p className="text-sm text-center py-4" style={{ color: 'var(--color-text-secondary)' }}>
                Nenhuma interação registrada ainda.
              </p>
            ) : (
              interacoes.map(int => {
                const especial = int.tipo === 'conversao' || int.tipo === 'mudanca_status';
                return (
                  <div key={int.id} className={`flex gap-3 ${especial ? 'p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5' : ''}`}>
                    <span className="text-lg flex-shrink-0 mt-0.5">
                      {int.tipo === 'mudanca_status' ? '↔️' : tipoInfo(int.tipo).emoji}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>
                          {int.tipo === 'conversao' ? '🎉 Convertido para Cliente'
                            : int.tipo === 'mudanca_status' ? 'Mudança de etapa'
                            : tipoInfo(int.tipo).label}
                        </span>
                        <span className="text-xs ml-auto" style={{ color: 'var(--color-text-secondary)' }}>
                          {tempoRelativo(int.criado_em)}
                        </span>
                      </div>
                      {int.tipo === 'mudanca_status' ? (
                        <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                          Moveu de <strong>{rotulos[int.metadata?.de] || int.metadata?.de}</strong> para{' '}
                          <strong>{rotulos[int.metadata?.para] || int.metadata?.para}</strong>
                        </p>
                      ) : (
                        <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>{int.conteudo}</p>
                      )}
                      {int.criado_por_user && (
                        <p className="text-xs mt-0.5 text-muted">por {int.criado_por_user.nome}</p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <form onSubmit={handleNovaInteracao} className="p-4 border-t" style={{ borderColor: 'var(--color-surface-border)' }}>
            <div className="flex gap-2 mb-2 flex-wrap">
              {TIPOS_INTERACAO.filter(t => t.key !== 'conversao').map(t => (
                <button key={t.key} type="button" onClick={() => setTipoInteracao(t.key)}
                  className={`text-xs px-2 py-1 rounded-full border transition-all ${tipoInteracao === t.key ? 'bg-primary-500/20 text-primary-300 border-primary-500/30' : 'text-muted border-slate-700 hover:border-slate-500'}`}>
                  {t.emoji} {t.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="text" value={novaInteracao} onChange={e => setNovaInteracao(e.target.value)}
                placeholder="Registrar interação..."
                className="flex-1 rounded-lg px-3 py-2 text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-primary)' }} />
              <button type="submit" disabled={enviandoInteracao || !novaInteracao.trim()}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                {enviandoInteracao ? '...' : 'Registrar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Aba: Arquivos */}
      {aba === 'arquivos' && (
        <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: 'var(--color-surface-card)', borderColor: 'var(--color-surface-border)' }}>
          <div className="p-5 space-y-3">
            {carregandoDoc ? (
              <div className="flex justify-center py-4"><Spinner /></div>
            ) : documentos.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-3xl mb-2">📎</p>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Nenhum arquivo anexado.</p>
              </div>
            ) : (
              documentos.map(doc => (
                <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg border"
                  style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-surface-border)' }}>
                  <span className="text-2xl flex-shrink-0">{emojiDocumento(doc.tipo)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>{doc.nome}</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                      {doc.tipo} · {doc.tamanho_kb ? `${doc.tamanho_kb} KB` : ''} · {formatarData(doc.criado_em)}
                    </p>
                  </div>
                  <button onClick={() => baixar(doc)} className="text-primary-400 hover:text-primary-300 text-sm flex-shrink-0" title="Baixar">
                    ⬇️
                  </button>
                  <PermissaoGuarda permissao="crm.excluir">
                    <button onClick={() => handleRemoverDoc(doc)} className="text-muted hover:text-red-400 text-sm flex-shrink-0" title="Remover">
                      🗑️
                    </button>
                  </PermissaoGuarda>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleUploadArquivo} className="p-4 border-t flex gap-2 flex-wrap items-center" style={{ borderColor: 'var(--color-surface-border)' }}>
            <input type="file" onChange={e => setArquivoEscolhido(e.target.files?.[0] || null)}
              className="text-xs flex-1 min-w-48" style={{ color: 'var(--color-text-secondary)' }} />
            <select value={tipoDocumento} onChange={e => setTipoDocumento(e.target.value)}
              className="rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
              style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-primary)' }}>
              {TIPOS_DOCUMENTO.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
            </select>
            <button type="submit" disabled={!arquivoEscolhido || enviandoArquivo}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
              {enviandoArquivo ? 'Enviando...' : 'Enviar'}
            </button>
          </form>
        </div>
      )}

      {/* Botão flutuante: criar anotação */}
      <button onClick={() => setModalNotaAberto(true)}
        className="fixed bottom-6 right-6 z-40 bg-primary-600 hover:bg-primary-500 text-white rounded-full px-4 py-3 text-sm font-medium shadow-lg transition-colors flex items-center gap-2">
        📝 Criar anotação
      </button>

      <ModalNota
        aberto={modalNotaAberto}
        onFechar={() => setModalNotaAberto(false)}
        onSalvar={(texto) => adicionarInteracao('nota', texto)}
      />

      {/* ModalLead abre via `aberto`; ModalCliente abre via `cliente`
          truthy — cada um gate à sua própria maneira, então passamos os
          dois de forma condicional a modalEditarAberto. */}
      <ModalEdicao
        aberto={modalEditarAberto}
        cliente={modalEditarAberto ? contato : null}
        leadEditando={contato}
        onFechar={() => setModalEditarAberto(false)}
        onSalvar={handleSalvarEdicao}
        rotulos={rotulos}
        usuariosTenant={usuariosTenant}
        usuario={usuario}
      />
    </div>
  );
};

export default DetalheContato;
