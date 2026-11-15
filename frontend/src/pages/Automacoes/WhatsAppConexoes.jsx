// =============================================================
// PRANCHETO.IA - CONEXÕES WHATSAPP (EVOLUTION API & META CLOUD)
// =============================================================
import React, { useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  WhatsappIcon,
  QrCodeIcon,
  CheckmarkCircle02Icon,
  Copy01Icon,
  RefreshIcon,
  Cancel01Icon,
  SmartPhone01Icon,
  Settings02Icon,
  Link01Icon,
} from '@hugeicons/core-free-icons';
import { Badge, BadgeDot } from '@/components/reui/badge';
import { Field, FieldLabel } from '@/components/ui/field';

const PROVIDER_META = {
  evolution: {
    titulo: 'Evolution API / Baileys',
    badge: 'QR Code · Alta Flexibilidade',
    badgeVariant: 'success',
    resumo: 'Conecte o WhatsApp comercial da sua equipe escaneando um QR Code em segundos.',
    corHeader: 'from-emerald-500/15 to-teal-500/10 border-emerald-500/25',
  },
  meta: {
    titulo: 'Meta WhatsApp Cloud API',
    badge: 'API Oficial · HSM Templates',
    badgeVariant: 'primary',
    resumo: 'API oficial do Facebook/Meta com alta entregabilidade e templates pré-aprovados.',
    corHeader: 'from-brand-secondary/15 to-sky-500/10 border-brand-secondary/25',
  },
};

// Matriz QR visual determinística para simulação realista de pareamento Evolution API
const QR_TAMANHO = 21;
const gerarCelulasQR = (seed = 'prancheto') => {
  const cells = [];
  const hashBase = seed.split('').reduce((acc, ch) => acc + ch.charCodeAt(0) * 17, 7);

  const inFinder = (r, c) =>
    (r < 7 && c < 7) || (r < 7 && c >= QR_TAMANHO - 7) || (r >= QR_TAMANHO - 7 && c < 7);

  for (let r = 0; r < QR_TAMANHO; r += 1) {
    for (let c = 0; c < QR_TAMANHO; c += 1) {
      let ativo = false;
      if (inFinder(r, c)) {
        const lr = r >= QR_TAMANHO - 7 ? r - (QR_TAMANHO - 7) : r;
        const lc = c >= QR_TAMANHO - 7 ? c - (QR_TAMANHO - 7) : c;
        const borda = lr === 0 || lr === 6 || lc === 0 || lc === 6;
        const miolo = lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4;
        ativo = borda || miolo;
      } else {
        ativo = ((r * 31 + c * 17 + hashBase) % 5) < 2;
      }
      if (ativo) cells.push({ r, c });
    }
  }
  return cells;
};

const WhatsAppConexoes = ({
  conexoes,
  onUpdateConexao,
  onNotificar,
}) => {
  const [modalQrConexaoId, setModalQrConexaoId] = useState(null);
  const [modalConfigId, setModalConfigId] = useState(null);
  const [qrSeed, setQrSeed] = useState('prancheto-evo-01');
  const [editForm, setEditForm] = useState({});
  const [testandoId, setTestandoId] = useState(null);

  const conexaoQr = conexoes.find((c) => c.id === modalQrConexaoId) || null;
  const conexaoConfig = conexoes.find((c) => c.id === modalConfigId) || null;
  const celulasQr = gerarCelulasQR(qrSeed);

  const copiarTexto = async (texto, label) => {
    try {
      await navigator.clipboard.writeText(texto);
      onNotificar('success', `${label} copiado para a área de transferência.`);
    } catch {
      onNotificar('info', `${label}: ${texto}`);
    }
  };

  const abrirConfig = (con) => {
    setEditForm({ ...con });
    setModalConfigId(con.id);
  };

  const salvarConfig = (e) => {
    e.preventDefault();
    if (!conexaoConfig) return;
    onUpdateConexao(conexaoConfig.id, {
      ...editForm,
      ultimaSincronizacao: 'Configuração atualizada agora',
    });
    setModalConfigId(null);
    onNotificar('success', `Credenciais de "${editForm.nome || conexaoConfig.nome}" salvas!`);
  };

  const simularTesteConexao = (con) => {
    setTestandoId(con.id);
    setTimeout(() => {
      const novoStatus = con.status === 'conectado' ? 'conectado' : 'conectado';
      onUpdateConexao(con.id, {
        status: novoStatus,
        ultimaSincronizacao: 'Verificado agora · Latência 142ms',
      });
      setTestandoId(null);
      onNotificar('success', `Instância "${con.nome}" respondeu HTTP 200 OK!`);
    }, 850);
  };

  const confirmarPareamentoQr = () => {
    if (!conexaoQr) return;
    onUpdateConexao(conexaoQr.id, {
      status: 'conectado',
      bateria: 96,
      ultimaSincronizacao: 'Pareado via QR Code agora',
    });
    setModalQrConexaoId(null);
    onNotificar('success', `WhatsApp "${conexaoQr.nome}" conectado com sucesso!`);
  };

  return (
    <div className="space-y-5">
      {/* Banner Explicativo da Arquitetura */}
      <div className="rounded-2xl border border-surface-border bg-surface-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="success" size="sm">
              <BadgeDot variant="success" pulse />
              Multi-Provedor WhatsApp
            </Badge>
            <Badge variant="outline" size="xs">
              Webhooks em Tempo Real
            </Badge>
          </div>
          <h3 className="text-base font-bold text-ink-primary">
            Conecte números comerciais ao motor de automações n8n
          </h3>
          <p className="text-xs text-ink-secondary max-w-2xl">
            Escolha entre pareamento imediato via QR Code (Evolution API) para atendimento humano próximo ou a Meta Cloud API Oficial para disparos em escala com templates aprovados.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="rounded-xl border border-surface-border bg-surface-subtle px-3.5 py-2 text-right">
            <p className="text-[11px] text-ink-secondary">Instâncias Online</p>
            <p className="text-lg font-extrabold text-ink-primary">
              {conexoes.filter((c) => c.status === 'conectado').length} / {conexoes.length}
            </p>
          </div>
        </div>
      </div>

      {/* Grid de Provedores / Instâncias */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {conexoes.map((con) => {
          const meta = PROVIDER_META[con.provider] || PROVIDER_META.evolution;
          const conectado = con.status === 'conectado';

          return (
            <div
              key={con.id}
              className="flex flex-col rounded-2xl border border-surface-border bg-surface-card shadow-xs overflow-hidden hover:border-surface-border-strong transition-colors"
            >
              {/* Cabeçalho do Card */}
              <div className={`p-4 border-b bg-gradient-to-br ${meta.corHeader}`}>
                <div className="flex items-start justify-between gap-2">
                  <Badge variant={meta.badgeVariant} size="xs">
                    {meta.badge}
                  </Badge>
                  <Badge variant={conectado ? 'success' : 'destructive'} size="xs">
                    <BadgeDot variant={conectado ? 'success' : 'destructive'} pulse={conectado} />
                    {conectado ? 'Conectado' : 'Desconectado'}
                  </Badge>
                </div>
                <h4 className="mt-3 text-sm font-bold text-ink-primary">{con.nome}</h4>
                <p className="mt-1 text-xs text-ink-secondary leading-relaxed">{meta.resumo}</p>
              </div>

              {/* Dados Técnicos da Instância */}
              <div className="p-4 space-y-3 flex-1 text-xs">
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="rounded-xl border border-surface-border bg-surface-subtle p-2.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                      Número Vinculado
                    </p>
                    <p className="mt-0.5 font-semibold text-ink-primary truncate">{con.telefone}</p>
                  </div>
                  <div className="rounded-xl border border-surface-border bg-surface-subtle p-2.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                      Disparos Hoje
                    </p>
                    <p className="mt-0.5 font-semibold text-ink-primary">
                      {con.disparosHoje || 0} msgs
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-surface-border bg-surface-subtle p-2.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted flex items-center gap-1">
                      <HugeiconsIcon icon={Link01Icon} size={11} />
                      Endpoint Webhook
                    </span>
                    <button
                      type="button"
                      onClick={() => copiarTexto(con.webhookUrl, 'Webhook URL')}
                      className="text-[11px] font-semibold text-brand-secondary hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <HugeiconsIcon icon={Copy01Icon} size={11} />
                      Copiar
                    </button>
                  </div>
                  <p className="font-mono text-[11px] text-ink-secondary truncate">{con.webhookUrl}</p>
                </div>

                {/* Templates HSM se Meta Cloud */}
                {Array.isArray(con.templatesAprovados) && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                      Templates HSM Meta
                    </p>
                    <div className="space-y-1">
                      {con.templatesAprovados.map((tpl) => (
                        <div
                          key={tpl.nome}
                          className="flex items-center justify-between rounded-lg border border-surface-border/70 px-2.5 py-1.5 bg-surface-subtle/40"
                        >
                          <span className="font-mono text-[11px] text-ink-primary truncate">
                            {tpl.nome}
                          </span>
                          <Badge
                            variant={tpl.status === 'APROVADO' ? 'success' : 'warning'}
                            size="xs"
                          >
                            {tpl.status === 'APROVADO' ? 'Aprovado' : 'Revisão'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-[11px] text-ink-muted pt-1">
                  Status: <span className="text-ink-secondary font-medium">{con.ultimaSincronizacao}</span>
                </p>
              </div>

              {/* Botões do Rodapé */}
              <div className="p-3.5 border-t border-surface-border bg-surface-subtle/50 flex flex-wrap items-center gap-2">
                {con.provider === 'evolution' && (
                  <button
                    type="button"
                    onClick={() => {
                      setQrSeed(`${con.id}-${Date.now()}`);
                      setModalQrConexaoId(con.id);
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3 py-2 text-xs font-semibold text-white transition-colors cursor-pointer"
                  >
                    <HugeiconsIcon icon={QrCodeIcon} size={14} strokeWidth={2} />
                    {conectado ? 'Reescanear QR' : 'Conectar QR Code'}
                  </button>
                )}

                <button
                  type="button"
                  disabled={testandoId === con.id}
                  onClick={() => simularTesteConexao(con)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-surface-border bg-surface-card hover:bg-surface-hover px-3 py-2 text-xs font-semibold text-ink-primary transition-colors cursor-pointer"
                >
                  <HugeiconsIcon
                    icon={RefreshIcon}
                    size={13}
                    className={testandoId === con.id ? 'animate-spin' : ''}
                  />
                  {testandoId === con.id ? 'Testando...' : 'Testar'}
                </button>

                <button
                  type="button"
                  onClick={() => abrirConfig(con)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-surface-border bg-surface-card hover:bg-surface-hover px-3 py-2 text-xs font-semibold text-ink-primary transition-colors cursor-pointer"
                >
                  <HugeiconsIcon icon={Settings02Icon} size={13} />
                  Credenciais
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal QR Code (Evolution API) */}
      {conexaoQr && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          onClick={() => setModalQrConexaoId(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-surface-border bg-surface-card p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  <HugeiconsIcon icon={WhatsappIcon} size={22} />
                </span>
                <div>
                  <h3 className="text-base font-bold text-ink-primary">Conectar via QR Code</h3>
                  <p className="text-xs text-ink-secondary">{conexaoQr.nome}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalQrConexaoId(null)}
                className="rounded-lg p-1.5 text-ink-secondary hover:bg-surface-hover cursor-pointer"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={16} />
              </button>
            </div>

            <div className="flex flex-col items-center justify-center rounded-2xl border border-surface-border bg-white p-5 shadow-inner">
              <svg
                viewBox={`0 0 ${QR_TAMANHO} ${QR_TAMANHO}`}
                className="w-48 h-48 text-[#0B132B]"
                shapeRendering="crispEdges"
              >
                <rect width={QR_TAMANHO} height={QR_TAMANHO} fill="#FFFFFF" />
                {celulasQr.map((cell) => (
                  <rect
                    key={`${cell.r}-${cell.c}`}
                    x={cell.c}
                    y={cell.r}
                    width={1}
                    height={1}
                    fill="currentColor"
                  />
                ))}
              </svg>
              <p className="mt-3 text-xs font-medium text-slate-600 text-center">
                Abra o WhatsApp no celular → <strong>Aparelhos conectados</strong> → Escaneie o código acima
              </p>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={() => setQrSeed(`${conexaoQr.id}-${Date.now()}`)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-surface-border px-3 py-2 text-xs font-semibold text-ink-primary hover:bg-surface-hover cursor-pointer"
              >
                <HugeiconsIcon icon={RefreshIcon} size={14} />
                Novo QR Code
              </button>
              <button
                type="button"
                onClick={confirmarPareamentoQr}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-semibold text-white cursor-pointer"
              >
                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} />
                Simular Leitura &amp; Ativar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Credenciais */}
      {conexaoConfig && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          onClick={() => setModalConfigId(null)}
        >
          <form
            onSubmit={salvarConfig}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-surface-border bg-surface-card p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HugeiconsIcon icon={SmartPhone01Icon} size={18} className="text-brand-secondary" />
                <h3 className="text-base font-bold text-ink-primary">Credenciais da Instância</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalConfigId(null)}
                className="rounded-lg p-1.5 text-ink-secondary hover:bg-surface-hover cursor-pointer"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={16} />
              </button>
            </div>

            <Field>
              <FieldLabel>Nome de Exibição</FieldLabel>
              <input
                type="text"
                value={editForm.nome || ''}
                onChange={(e) => setEditForm((f) => ({ ...f, nome: e.target.value }))}
                className="h-10 w-full rounded-xl border border-surface-border bg-surface-subtle px-3 text-sm font-medium text-ink-primary outline-none focus:border-brand-primary"
              />
            </Field>

            <Field>
              <FieldLabel>Instância / Phone Number ID</FieldLabel>
              <input
                type="text"
                value={editForm.instancia || ''}
                onChange={(e) => setEditForm((f) => ({ ...f, instancia: e.target.value }))}
                className="h-10 w-full rounded-xl border border-surface-border bg-surface-subtle px-3 text-sm font-mono font-medium text-ink-primary outline-none focus:border-brand-primary"
              />
            </Field>

            <Field>
              <FieldLabel>Número WhatsApp (E.164)</FieldLabel>
              <input
                type="text"
                value={editForm.telefone || ''}
                onChange={(e) => setEditForm((f) => ({ ...f, telefone: e.target.value }))}
                className="h-10 w-full rounded-xl border border-surface-border bg-surface-subtle px-3 text-sm font-medium text-ink-primary outline-none focus:border-brand-primary"
              />
            </Field>

            <Field>
              <FieldLabel>Webhook URL de Retorno</FieldLabel>
              <input
                type="text"
                value={editForm.webhookUrl || ''}
                onChange={(e) => setEditForm((f) => ({ ...f, webhookUrl: e.target.value }))}
                className="h-10 w-full rounded-xl border border-surface-border bg-surface-subtle px-3 text-xs font-mono text-ink-primary outline-none focus:border-brand-primary"
              />
            </Field>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalConfigId(null)}
                className="rounded-xl border border-surface-border px-3.5 py-2 text-xs font-semibold text-ink-secondary hover:bg-surface-hover cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-xl bg-brand-secondary hover:bg-brand-primary px-4 py-2 text-xs font-semibold text-white cursor-pointer"
              >
                Salvar Credenciais
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default WhatsAppConexoes;

