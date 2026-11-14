// =============================================================
// PRANCHETO.IA - MÓDULO DE CALENDÁRIO & AGENDA
// Layout executivo focado no calendário como elemento central.
// Cabeçalho otimizado, expansão vertical total sem scroll,
// filtros em abas com indicadores semânticos, busca integrada (sem sobreposição)
// e seletor de negócio associado com busca e criação inline.
// Emitly Design System do Prancheto.IA.
// =============================================================

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { DndContext, PointerSensor, useSensor, useSensors, useDroppable, useDraggable } from '@dnd-kit/core';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { DatePicker } from '@/components/ui/date-picker';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Search01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ArrowDown01Icon,
  Add01Icon,
  Location01Icon,
  Delete02Icon,
  Briefcase01Icon,
  Cancel01Icon,
  FilterIcon,
} from '@hugeicons/core-free-icons';

// -------------------------------------------------------------
// CONFIGURAÇÃO DOS TIPOS DE EVENTO (PALETA PASTEL MODERNA E NÍTIDA)
// -------------------------------------------------------------
const TIPOS_EVENTO = {
  reuniao: {
    label: 'Reunião',
    bg: 'bg-[#FCE7F3]',
    border: 'border-[#F472B6]',
    text: 'text-[#831843]',
    dot: 'bg-[#DB2777]',
    cor: '#DB2777',
    temDot: false,
  },
  tarefa: {
    label: 'Tarefa',
    bg: 'bg-[#DBEAFE]',
    border: 'border-[#60A5FA]',
    text: 'text-[#1E40AF]',
    dot: 'bg-[#2563EB]',
    cor: '#2563EB',
    temDot: false,
  },
  lembrete: {
    label: 'Lembrete',
    bg: 'bg-[#FFEDD5]',
    border: 'border-[#FB923C]',
    text: 'text-[#9A3412]',
    dot: 'bg-[#EA580C]',
    cor: '#EA580C',
    temDot: true,
  },
  ligacao: {
    label: 'Ligação',
    bg: 'bg-[#D1FAE5]',
    border: 'border-[#34D399]',
    text: 'text-[#065F46]',
    dot: 'bg-[#059669]',
    cor: '#059669',
    temDot: true,
  },
  outro: {
    label: 'Outro',
    bg: 'bg-[#FEF08A]',
    border: 'border-[#FACC15]',
    text: 'text-[#78350F]',
    dot: 'bg-[#CA8A04]',
    cor: '#CA8A04',
    temDot: true,
  },
};

const DIAS_SEMANA = [
  { curto: 'Mon', completo: 'Segunda-feira' },
  { curto: 'Tues', completo: 'Terça-feira' },
  { curto: 'Wed', completo: 'Quarta-feira' },
  { curto: 'Thu', completo: 'Quinta-feira' },
  { curto: 'Fri', completo: 'Sexta-feira' },
  { curto: 'Sat', completo: 'Sábado' },
  { curto: 'Sun', completo: 'Domingo' },
];

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const MESES_ABREV = [
  'JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN',
  'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'
];

const pad2 = (n) => String(n).padStart(2, '0');

// Geração da grade mensal iniciando na SEGUNDA-FEIRA (ISO standard)
const getGradeDoMes = (ano, mes) => {
  const primeiroDiaMes = new Date(ano, mes, 1);
  const diaSemanaInicio = (primeiroDiaMes.getDay() + 6) % 7;
  const totalDiasMes = new Date(ano, mes + 1, 0).getDate();
  const totalDiasMesAnterior = new Date(ano, mes, 0).getDate();

  const dias = [];

  // Dias do mês anterior
  for (let i = diaSemanaInicio - 1; i >= 0; i--) {
    const dia = totalDiasMesAnterior - i;
    const mesRef = mes === 0 ? 11 : mes - 1;
    const anoRef = mes === 0 ? ano - 1 : ano;
    dias.push({ dia, mes: mesRef, ano: anoRef, atual: false });
  }

  // Dias do mês atual
  for (let dia = 1; dia <= totalDiasMes; dia++) {
    dias.push({ dia, mes, ano, atual: true });
  }

  // Dias do próximo mês para completar semanas cheias de 7 dias
  const diasRestantes = (7 - (dias.length % 7)) % 7;
  for (let dia = 1; dia <= diasRestantes; dia++) {
    const mesRef = mes === 11 ? 0 : mes + 1;
    const anoRef = mes === 11 ? ano + 1 : ano;
    dias.push({ dia, mes: mesRef, ano: anoRef, atual: false });
  }

  return dias;
};

const formatarIntervaloMes = (ano, mes) => {
  const totalDias = new Date(ano, mes + 1, 0).getDate();
  const mesNomeAbrev = MESES[mes].slice(0, 3).toLowerCase();
  return `1 de ${mesNomeAbrev} de ${ano} – ${totalDias} de ${mesNomeAbrev} de ${ano}`;
};

const FORM_VAZIO = {
  titulo: '',
  tipo: 'reuniao',
  data_inicio: '',
  hora: '09:00',
  descricao: '',
  local: '',
  negocio_id: null,
  negocio_nome: '',
};

// -------------------------------------------------------------
// MODAL: Criar / Editar Evento com Seletor de Negócio
// -------------------------------------------------------------
const ModalEvento = ({
  aberto,
  onFechar,
  onSalvar,
  onExcluir,
  eventoEditando,
  diaSelecionado,
  mesSelecionado,
  anoSelecionado,
  tenantId,
}) => {
  const [form, setForm] = useState(FORM_VAZIO);

  // Estados do Seletor de Negócio
  const [listaNegocios, setListaNegocios] = useState([]);
  const [dropdownNegocioAberto, setDropdownNegocioAberto] = useState(false);
  const [buscaNegocio, setBuscaNegocio] = useState('');
  const [criandoNegocioInline, setCriandoNegocioInline] = useState(false);
  const [novoNegocioNome, setNovoNegocioNome] = useState('');
  const [novoNegocioValor, setNovoNegocioValor] = useState('');
  const negocioRef = useRef(null);

  // Carregar negócios cadastrados no CRM
  useEffect(() => {
    if (!aberto) return;

    let cancelado = false;
    const carregarNegocios = async () => {
      try {
        let query = supabase
          .from('crm_contatos')
          .select('id, negocio_nome, nome, empresa, valor_estimado, status_funil')
          .order('criado_em', { ascending: false });

        if (tenantId) query = query.eq('tenant_id', tenantId);

        const { data, error } = await query;
        if (!cancelado && !error && data) {
          const deals = data
            .map((d) => ({
              id: d.id,
              negocio_nome: d.negocio_nome || d.empresa || d.nome,
              nome: d.nome,
              empresa: d.empresa,
              valor_estimado: d.valor_estimado,
            }))
            .filter((d) => Boolean(d.negocio_nome));

          setListaNegocios(deals);
        }
      } catch (err) {
        console.warn('Erro ao carregar negócios para o calendário:', err);
      }
    };

    carregarNegocios();
    return () => {
      cancelado = true;
    };
  }, [aberto, tenantId]);

  // Fechar dropdown de negócio ao clicar fora
  useEffect(() => {
    const handleClickFora = (e) => {
      if (negocioRef.current && !negocioRef.current.contains(e.target)) {
        setDropdownNegocioAberto(false);
        setCriandoNegocioInline(false);
      }
    };
    if (dropdownNegocioAberto) {
      document.addEventListener('mousedown', handleClickFora);
      return () => document.removeEventListener('mousedown', handleClickFora);
    }
  }, [dropdownNegocioAberto]);

  // Sincroniza formulário com o evento editando ou data selecionada
  useEffect(() => {
    if (eventoEditando) {
      const d = new Date(eventoEditando.data_inicio);
      setForm({
        titulo: eventoEditando.titulo || '',
        tipo: eventoEditando.tipo || 'reuniao',
        data_inicio: `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`,
        hora: `${pad2(d.getHours())}:${pad2(d.getMinutes())}`,
        descricao: eventoEditando.descricao || '',
        local: eventoEditando.local || '',
        negocio_id: eventoEditando.metadata?.negocio_id || null,
        negocio_nome: eventoEditando.metadata?.negocio_nome || '',
      });
    } else if (diaSelecionado) {
      const mes = pad2(mesSelecionado + 1);
      const dia = pad2(diaSelecionado);
      setForm({ ...FORM_VAZIO, data_inicio: `${anoSelecionado}-${mes}-${dia}` });
    } else {
      setForm(FORM_VAZIO);
    }
    setDropdownNegocioAberto(false);
    setCriandoNegocioInline(false);
    setBuscaNegocio('');
  }, [eventoEditando, diaSelecionado, mesSelecionado, anoSelecionado, aberto]);

  if (!aberto) return null;

  // Filtragem de negócios existentes
  const negociosFiltrados = listaNegocios.filter((n) => {
    if (!buscaNegocio.trim()) return true;
    const termo = buscaNegocio.toLowerCase();
    return (
      n.negocio_nome?.toLowerCase().includes(termo) ||
      n.nome?.toLowerCase().includes(termo) ||
      n.empresa?.toLowerCase().includes(termo)
    );
  });

  // Criar negócio inline e vinculá-lo imediatamente
  const handleCriarNegocioInline = async () => {
    if (!novoNegocioNome.trim()) return;

    const nomeFormatado = novoNegocioNome.trim();
    const valorNumerico = novoNegocioValor ? Number(novoNegocioValor) : null;

    const novoDeal = {
      id: `deal-${Date.now()}`,
      negocio_nome: nomeFormatado,
      nome: nomeFormatado,
      valor_estimado: valorNumerico,
      status_funil: 'lead',
    };

    if (tenantId) {
      try {
        const { data, error } = await supabase
          .from('crm_contatos')
          .insert({
            tenant_id: tenantId,
            negocio_nome: nomeFormatado,
            nome: nomeFormatado,
            valor_estimado: valorNumerico,
            status_funil: 'lead',
            origem: 'Agenda / Calendário',
          })
          .select()
          .single();

        if (!error && data) {
          novoDeal.id = data.id;
        }
      } catch (err) {
        console.warn('Erro ao salvar novo negócio no banco:', err);
      }
    }

    setListaNegocios((prev) => [novoDeal, ...prev]);
    setForm((f) => ({
      ...f,
      negocio_id: novoDeal.id,
      negocio_nome: novoDeal.negocio_nome,
    }));
    setNovoNegocioNome('');
    setNovoNegocioValor('');
    setCriandoNegocioInline(false);
    setDropdownNegocioAberto(false);
    setBuscaNegocio('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.titulo.trim()) return;

    const [ano, mes, dia] = form.data_inicio.split('-').map(Number);
    const [hora, minuto] = form.hora.split(':').map(Number);
    const dataHora = new Date(ano, mes - 1, dia, hora, minuto);

    await onSalvar({
      titulo: form.titulo.trim(),
      tipo: form.tipo,
      data_inicio: dataHora.toISOString(),
      descricao: form.descricao?.trim() || null,
      local: form.local?.trim() || null,
      metadata: {
        ...(eventoEditando?.metadata || {}),
        negocio_id: form.negocio_id || null,
        negocio_nome: form.negocio_nome || null,
      },
    });
    onFechar();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4"
      onClick={onFechar}
    >
      <div
        className="w-full max-w-lg bg-white rounded-2xl p-6 space-y-4 shadow-2xl border border-[#E4ECE7] max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3.5 border-b border-[#E4ECE7]">
          <div>
            <h2 className="text-base font-extrabold text-[#111915]">
              {eventoEditando ? 'Editar Compromisso' : 'Novo Compromisso'}
            </h2>
            <p className="text-sm text-[#687770]">
              {eventoEditando ? 'Atualize as informações do evento na agenda' : 'Preencha os detalhes para agendar'}
            </p>
          </div>
          <button
            type="button"
            onClick={onFechar}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-[#F7FAF8] transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Título do Compromisso */}
          <div>
            <label className="block text-sm font-bold text-[#111915] mb-1.5">
              Título do compromisso *
            </label>
            <input
              type="text"
              className="w-full px-3.5 py-2.5 bg-[#F7FAF8] border border-[#E4ECE7] rounded-xl text-sm text-[#111915] placeholder:text-[#8A9A92] focus:outline-none focus:border-[#0E382C] focus:bg-white transition-all shadow-2xs"
              placeholder="Ex: Reunião de Alinhamento de Produto"
              value={form.titulo}
              onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
              required
            />
          </div>

          {/* Campo Seletor de Negócio (com busca ou criação inline) */}
          <div className="relative" ref={negocioRef}>
            <label className="block text-sm font-bold text-[#111915] mb-1.5 flex items-center justify-between">
              <span>Negócio associado</span>
              <span className="text-[11px] font-normal text-[#687770]">Opcional</span>
            </label>

            {/* Trigger do Seletor */}
            <div
              onClick={() => setDropdownNegocioAberto(!dropdownNegocioAberto)}
              className="w-full px-3.5 py-2.5 bg-[#F7FAF8] hover:bg-white border border-[#E4ECE7] focus-within:border-[#0E382C] rounded-xl text-sm flex items-center justify-between cursor-pointer transition-all shadow-2xs"
            >
              <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                <HugeiconsIcon icon={Briefcase01Icon} size={15} className="text-[#0E382C] flex-shrink-0" />
                {form.negocio_nome ? (
                  <span className="font-bold text-[#111915] truncate">
                    {form.negocio_nome}
                  </span>
                ) : (
                  <span className="text-[#8A9A92] truncate">
                    Selecionar ou criar um negócio...
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                {form.negocio_nome && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setForm((f) => ({ ...f, negocio_id: null, negocio_nome: '' }));
                    }}
                    className="p-1 hover:bg-[#E4ECE7] rounded text-[#687770] hover:text-[#111915] transition-colors"
                    title="Remover negócio"
                  >
                    <HugeiconsIcon icon={Cancel01Icon} size={13} />
                  </button>
                )}
                <HugeiconsIcon
                  icon={ArrowDown01Icon}
                  size={14}
                  className={`text-[#687770] transition-transform duration-200 ${
                    dropdownNegocioAberto ? 'rotate-180' : ''
                  }`}
                />
              </div>
            </div>

            {/* Dropdown Flutuante */}
            {dropdownNegocioAberto && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-[#E4ECE7] rounded-xl shadow-2xl z-50 overflow-hidden text-sm">
                {!criandoNegocioInline ? (
                  <>
                    {/* Barra de Busca no Dropdown */}
                    <div className="p-2 border-b border-[#E4ECE7] bg-[#F7FAF8]">
                      <div className="relative">
                        <HugeiconsIcon
                          icon={Search01Icon}
                          size={14}
                          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8A9A92] pointer-events-none"
                        />
                        <input
                          type="text"
                          placeholder="Buscar negócio..."
                          value={buscaNegocio}
                          onChange={(e) => setBuscaNegocio(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#E4ECE7] rounded-lg text-sm text-[#111915] placeholder:text-[#8A9A92] focus:outline-none focus:border-[#0E382C]"
                          autoFocus
                        />
                      </div>
                    </div>

                    {/* Lista de Negócios Filtrados */}
                    <div className="max-h-44 overflow-y-auto divide-y divide-[#F0F4F2]">
                      {negociosFiltrados.length === 0 ? (
                        <div className="px-4 py-4 text-center text-sm text-[#687770]">
                          {buscaNegocio ? 'Nenhum negócio encontrado.' : 'Nenhum negócio cadastrado.'}
                        </div>
                      ) : (
                        negociosFiltrados.map((n) => {
                          const selecionado =
                            form.negocio_id === n.id || form.negocio_nome === (n.negocio_nome || n.nome);
                          return (
                            <button
                              key={n.id}
                              type="button"
                              onClick={() => {
                                setForm((f) => ({
                                  ...f,
                                  negocio_id: n.id,
                                  negocio_nome: n.negocio_nome || n.nome,
                                }));
                                setDropdownNegocioAberto(false);
                                setBuscaNegocio('');
                              }}
                              className={`w-full px-3.5 py-2.5 text-left flex items-center justify-between hover:bg-[#F7FAF8] transition-colors ${
                                selecionado ? 'bg-[#DCF5E4]/60 font-bold text-[#0E382C]' : 'text-[#111915]'
                              }`}
                            >
                              <div className="truncate pr-2">
                                <p className="font-semibold text-sm text-[#111915] truncate">
                                  {n.negocio_nome || n.nome}
                                </p>
                                {(n.empresa || n.valor_estimado) && (
                                  <p className="text-[10px] text-[#687770] truncate mt-0.5">
                                    {[
                                      n.empresa,
                                      n.valor_estimado
                                        ? `R$ ${Number(n.valor_estimado).toLocaleString('pt-BR', {
                                            minimumFractionDigits: 2,
                                          })}`
                                        : null,
                                    ]
                                      .filter(Boolean)
                                      .join(' · ')}
                                  </p>
                                )}
                              </div>
                              {selecionado && (
                                <span className="text-[#0E382C] font-bold text-sm flex-shrink-0">✓</span>
                              )}
                            </button>
                          );
                        })
                      )}
                    </div>

                    {/* Botão de Adicionar / Criar Negócio */}
                    <div className="p-2 border-t border-[#E4ECE7] bg-[#F7FAF8]">
                      <button
                        type="button"
                        onClick={() => {
                          setCriandoNegocioInline(true);
                          setNovoNegocioNome(buscaNegocio);
                        }}
                        className="w-full py-1.5 px-3 bg-white hover:bg-[#EDF2EE] border border-[#E4ECE7] text-[#0E382C] rounded-lg text-sm font-bold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                      >
                        <HugeiconsIcon icon={Add01Icon} size={14} strokeWidth={2.5} />
                        <span>Adicionar um negócio</span>
                      </button>
                    </div>
                  </>
                ) : (
                  /* Form Inline de Criação de Negócio */
                  <div className="p-3.5 space-y-2.5 bg-white">
                    <div className="flex items-center justify-between pb-1 border-b border-[#E4ECE7]">
                      <span className="font-extrabold text-sm text-[#111915]">Adicionar novo negócio</span>
                      <button
                        type="button"
                        onClick={() => setCriandoNegocioInline(false)}
                        className="text-[11px] text-[#687770] hover:text-[#111915]"
                      >
                        Voltar
                      </button>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#111915] mb-1">
                        Título do negócio *
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Consultoria Estratégica"
                        value={novoNegocioNome}
                        onChange={(e) => setNovoNegocioNome(e.target.value)}
                        className="w-full px-3 py-1.5 bg-[#F7FAF8] border border-[#E4ECE7] rounded-lg text-sm text-[#111915] focus:outline-none focus:border-[#0E382C]"
                        autoFocus
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#111915] mb-1">
                        Valor do negócio (R$)
                      </label>
                      <input
                        type="number"
                        placeholder="Ex: 5000"
                        value={novoNegocioValor}
                        onChange={(e) => setNovoNegocioValor(e.target.value)}
                        className="w-full px-3 py-1.5 bg-[#F7FAF8] border border-[#E4ECE7] rounded-lg text-sm text-[#111915] focus:outline-none focus:border-[#0E382C]"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setCriandoNegocioInline(false)}
                        className="flex-1 py-1.5 bg-[#F7FAF8] hover:bg-[#EDF2EE] border border-[#E4ECE7] text-[#687770] rounded-lg text-sm font-semibold"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleCriarNegocioInline}
                        disabled={!novoNegocioNome.trim()}
                        className="flex-1 py-1.5 bg-[#0E382C] hover:bg-[#07261E] disabled:opacity-50 text-white rounded-lg text-sm font-bold shadow-xs transition-colors"
                      >
                        Criar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Tipo de Evento */}
          <div>
            <label className="block text-sm font-bold text-[#111915] mb-1.5">
              Tipo de evento
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {Object.entries(TIPOS_EVENTO).map(([chave, val]) => (
                <button
                  type="button"
                  key={chave}
                  onClick={() => setForm((f) => ({ ...f, tipo: chave }))}
                  className={`px-2.5 py-2 rounded-xl text-sm font-semibold border flex flex-col items-center justify-center gap-1 transition-all ${
                    form.tipo === chave
                      ? 'border-[#0E382C] bg-[#DCF5E4] text-[#0E382C] shadow-2xs'
                      : 'border-[#E4ECE7] bg-[#F7FAF8] text-[#687770] hover:bg-white'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${val.dot}`} />
                  <span className="truncate">{val.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Data e Horário */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-bold text-[#111915] mb-1.5">
                Data do evento *
              </label>
              <DatePicker
                value={form.data_inicio}
                onChange={(e) => setForm((f) => ({ ...f, data_inicio: e.target.value }))}
                placeholder="Selecionar data do evento"
                clearable={false}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#111915] mb-1.5">
                Horário de início *
              </label>
              <input
                type="time"
                className="w-full px-3.5 py-2.5 bg-[#F7FAF8] border border-[#E4ECE7] rounded-xl text-sm text-[#111915] focus:outline-none focus:border-[#0E382C] focus:bg-white transition-all shadow-2xs"
                value={form.hora}
                onChange={(e) => setForm((f) => ({ ...f, hora: e.target.value }))}
                required
              />
            </div>
          </div>

          {/* Local ou Link */}
          <div>
            <label className="block text-sm font-bold text-[#111915] mb-1.5">
              Local ou link da reunião
            </label>
            <div className="relative">
              <HugeiconsIcon
                icon={Location01Icon}
                size={16}
                strokeWidth={1.8}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A9A92] pointer-events-none"
              />
              <input
                type="text"
                className="w-full pl-9 pr-3.5 py-2.5 bg-[#F7FAF8] border border-[#E4ECE7] rounded-xl text-sm text-[#111915] placeholder:text-[#8A9A92] focus:outline-none focus:border-[#0E382C] focus:bg-white transition-all shadow-2xs"
                placeholder="Google Meet, Zoom ou endereço físico"
                value={form.local}
                onChange={(e) => setForm((f) => ({ ...f, local: e.target.value }))}
              />
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-bold text-[#111915] mb-1.5">
              Descrição ou pauta
            </label>
            <textarea
              className="w-full px-3.5 py-2.5 bg-[#F7FAF8] border border-[#E4ECE7] rounded-xl text-sm text-[#111915] placeholder:text-[#8A9A92] focus:outline-none focus:border-[#0E382C] focus:bg-white transition-all resize-none shadow-2xs"
              placeholder="Objetivos do encontro, participantes e links de apoio..."
              rows={2}
              value={form.descricao}
              onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
            />
          </div>

          {/* Rodapé de Ações */}
          <div className="flex items-center justify-between pt-3 border-t border-[#E4ECE7]">
            {eventoEditando ? (
              <button
                type="button"
                onClick={() => {
                  onExcluir(eventoEditando.id);
                  onFechar();
                }}
                className="px-3 py-2 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-xl text-sm font-bold transition-colors flex items-center gap-1.5"
              >
                <HugeiconsIcon icon={Delete02Icon} size={15} strokeWidth={2} />
                <span>Excluir</span>
              </button>
            ) : (
              <span />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onFechar}
                className="px-4 py-2 bg-[#F7FAF8] border border-[#E4ECE7] text-[#687770] hover:text-[#111915] text-sm font-semibold rounded-xl hover:bg-white transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#0E382C] text-white text-sm font-bold rounded-xl shadow-xs hover:bg-[#07261E] transition-all"
              >
                Salvar compromisso
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// COMPONENTE: Chip do Evento Arrastável (Estilo Pastel Elegante e Nítido)
// -------------------------------------------------------------
const EventoArrastavel = ({ evento, onClick }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: evento.id });
  const tipo = TIPOS_EVENTO[evento.tipo] || TIPOS_EVENTO.outro;

  const d = new Date(evento.data_inicio);
  const horaStr = `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  const nomeNegocio = evento.metadata?.negocio_nome;

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        e.stopPropagation();
        onClick(evento);
      }}
      className={`group px-2 py-0.5 rounded-md text-[11px] font-semibold flex items-center justify-between gap-1 border transition-all cursor-grab active:cursor-grabbing select-none h-[22px] ${
        tipo.bg
      } ${tipo.border} ${tipo.text} hover:shadow-2xs ${
        isDragging ? 'opacity-40 scale-95 shadow-lg' : 'hover:brightness-95'
      }`}
      title={`${evento.titulo} (${horaStr})${nomeNegocio ? ` • Negócio: ${nomeNegocio}` : ''}`}
    >
      <div className="flex items-center gap-1.5 min-w-0 flex-1">
        {tipo.temDot && (
          <span className={`w-1.5 h-1.5 rounded-full ${tipo.dot} flex-shrink-0`} />
        )}
        <span className="truncate leading-tight font-semibold">{evento.titulo}</span>
      </div>
      <span className="text-[10px] font-bold opacity-85 flex-shrink-0 tracking-tight">
        {horaStr}
      </span>
    </div>
  );
};

// -------------------------------------------------------------
// COMPONENTE: Célula de Dia na Grade Mensal (Encaixe Perfeito de 2 Itens + Indicador)
// -------------------------------------------------------------
const CelulaDia = ({
  dia,
  mes,
  ano,
  atual,
  eventos,
  hoje,
  onClicar,
  onAbrirEvento,
  onVerMais,
}) => {
  const { setNodeRef, isOver } = useDroppable({ id: `dia-${ano}-${mes}-${dia}` });
  const eHoje = hoje.getDate() === dia && hoje.getMonth() === mes && hoje.getFullYear() === ano;

  const temMaisDeDois = eventos.length > 2;
  const visiveis = temMaisDeDois ? eventos.slice(0, 2) : eventos;
  const excedente = eventos.length - 2;

  return (
    <div
      ref={setNodeRef}
      onClick={() => onClicar(dia, mes, ano)}
      className={`h-full p-1.5 sm:p-2 bg-white transition-colors cursor-pointer flex flex-col justify-start overflow-hidden ${
        isOver ? 'bg-[#D4EC9D]/20' : 'hover:bg-[#F9FCFA]'
      } ${atual ? '' : 'bg-[#FAFCFB] opacity-45'}`}
    >
      {/* Cabeçalho do dia */}
      <div className="flex items-center justify-between mb-1 flex-shrink-0">
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
            eHoje
              ? 'bg-[#111915] text-white shadow-xs'
              : atual
              ? 'text-[#111915]'
              : 'text-slate-400 font-medium'
          }`}
        >
          {dia}
        </div>
      </div>

      {/* Lista de eventos (Máximo 2 visíveis + 1 botão indicador se houver 3 ou mais) */}
      <div className="space-y-1 flex-1 min-h-0 overflow-hidden">
        {visiveis.map((ev) => (
          <EventoArrastavel key={ev.id} evento={ev} onClick={onAbrirEvento} />
        ))}

        {temMaisDeDois && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onVerMais(e, dia, mes, ano, eventos);
            }}
            className="w-full py-0.5 px-2 text-[10px] font-bold text-brand-primary dark:text-[#7DD3FC] bg-surface-subtle hover:bg-surface-hover border border-surface-border rounded-md transition-all flex items-center justify-between group shadow-2xs h-[20px] cursor-pointer"
            title="Ver todos os eventos deste dia"
          >
            <span className="truncate">+{excedente} {excedente === 1 ? 'evento' : 'eventos'}</span>
            <span className="text-[9px] text-ink-secondary group-hover:text-brand-primary dark:group-hover:text-[#7DD3FC] flex-shrink-0">ver todos →</span>
          </button>
        )}
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// COMPONENTE PRINCIPAL: Calendario
// -------------------------------------------------------------
const Calendario = () => {
  const usuario = useAuthStore((s) => s.usuario);
  const [eventos, setEventos] = useState([]);
  const [mesAtual, setMesAtual] = useState(new Date().getMonth());
  const [anoAtual, setAnoAtual] = useState(new Date().getFullYear());
  const [abaAtiva, setAbaAtiva] = useState('todos');
  const [busca, setBusca] = useState('');
  const [visaoModo, setVisaoModo] = useState('mes'); // 'mes' | 'semana' | 'lista'
  const [dropdownVisao, setDropdownVisao] = useState(false);
  const [dropdownFiltro, setDropdownFiltro] = useState(false);
  const inputBuscaRef = useRef(null);
  const dropdownVisaoRef = useRef(null);
  const dropdownFiltroRef = useRef(null);

  // Fechar dropdowns de visão e filtro ao clicar fora
  useEffect(() => {
    const handleClickFora = (e) => {
      if (dropdownVisaoRef.current && !dropdownVisaoRef.current.contains(e.target)) {
        setDropdownVisao(false);
      }
      if (dropdownFiltroRef.current && !dropdownFiltroRef.current.contains(e.target)) {
        setDropdownFiltro(false);
      }
    };
    if (dropdownVisao || dropdownFiltro) {
      document.addEventListener('mousedown', handleClickFora);
      return () => document.removeEventListener('mousedown', handleClickFora);
    }
  }, [dropdownVisao, dropdownFiltro]);

  // Estados dos Modais
  const [modalAberto, setModalAberto] = useState(false);
  const [diaSelecionado, setDiaSelecionado] = useState(null);
  const [mesSelecionado, setMesSelecionado] = useState(mesAtual);
  const [anoSelecionado, setAnoSelecionado] = useState(anoAtual);
  const [eventoEditando, setEventoEditando] = useState(null);

  // Pop-up flutuante ancorado ao lado do dia (+N eventos, sem overlay escuro)
  const [popoverDia, setPopoverDia] = useState(null);

  const hoje = new Date();
  const tenantId = usuario?.tenant_id;
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const grade = useMemo(() => getGradeDoMes(anoAtual, mesAtual), [anoAtual, mesAtual]);
  const primeiraCelula = grade[0];
  const ultimaCelula = grade[grade.length - 1];

  // Atalho de teclado Cmd+K / Ctrl+K para buscar
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputBuscaRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Carregar eventos do Supabase
  const carregar = useCallback(async () => {
    if (!tenantId) return;
    const inicio = new Date(primeiraCelula.ano, primeiraCelula.mes, primeiraCelula.dia).toISOString();
    const fim = new Date(ultimaCelula.ano, ultimaCelula.mes, ultimaCelula.dia, 23, 59, 59).toISOString();

    const { data, error } = await supabase
      .from('agenda_eventos')
      .select('*')
      .eq('tenant_id', tenantId)
      .gte('data_inicio', inicio)
      .lte('data_inicio', fim)
      .order('data_inicio', { ascending: true });

    if (!error && data) {
      setEventos(data);
    }
  }, [tenantId, primeiraCelula.ano, primeiraCelula.mes, primeiraCelula.dia, ultimaCelula.ano, ultimaCelula.mes, ultimaCelula.dia]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // Salvar compromisso (Create / Update)
  const handleSalvar = async (dados) => {
    if (eventoEditando) {
      await supabase.from('agenda_eventos').update(dados).eq('id', eventoEditando.id);
    } else {
      await supabase.from('agenda_eventos').insert({
        ...dados,
        tenant_id: tenantId,
        criado_por: usuario?.id,
        status: 'agendado',
      });
    }
    await carregar();
  };

  // Excluir compromisso
  const handleExcluir = async (id) => {
    await supabase.from('agenda_eventos').delete().eq('id', id);
    await carregar();
  };

  // Drag and Drop entre células
  const handleDragEnd = async ({ active, over }) => {
    if (!over) return;
    const overId = String(over.id);
    if (!overId.startsWith('dia-')) return;

    const [, ano, mes, dia] = overId.split('-');
    const evento = eventos.find((e) => e.id === active.id);
    if (!evento) return;

    const dataOriginal = new Date(evento.data_inicio);
    const novaData = new Date(
      parseInt(ano, 10),
      parseInt(mes, 10),
      parseInt(dia, 10),
      dataOriginal.getHours(),
      dataOriginal.getMinutes()
    );

    // Atualização otimista
    setEventos((prev) =>
      prev.map((e) => (e.id === evento.id ? { ...e, data_inicio: novaData.toISOString() } : e))
    );

    await supabase
      .from('agenda_eventos')
      .update({ data_inicio: novaData.toISOString() })
      .eq('id', evento.id);

    await carregar();
  };

  // Filtros aplicados (busca textual e aba de categoria)
  const eventosFiltrados = useMemo(() => {
    return eventos.filter((ev) => {
      // Filtro da aba
      if (abaAtiva !== 'todos' && ev.tipo !== abaAtiva) {
        return false;
      }
      // Filtro da busca
      if (busca.trim()) {
        const termo = busca.toLowerCase();
        const noTitulo = ev.titulo?.toLowerCase().includes(termo);
        const naDesc = ev.descricao?.toLowerCase().includes(termo);
        const noLocal = ev.local?.toLowerCase().includes(termo);
        const noNegocio = ev.metadata?.negocio_nome?.toLowerCase().includes(termo);
        if (!noTitulo && !naDesc && !noLocal && !noNegocio) return false;
      }
      return true;
    });
  }, [eventos, abaAtiva, busca]);

  const eventosDoDia = (dia, mes, ano) =>
    eventosFiltrados.filter((e) => {
      const d = new Date(e.data_inicio);
      return d.getDate() === dia && d.getMonth() === mes && d.getFullYear() === ano;
    });

  // Navegação
  const irMesAnterior = () => {
    if (mesAtual === 0) {
      setMesAtual(11);
      setAnoAtual((a) => a - 1);
    } else {
      setMesAtual((m) => m - 1);
    }
  };

  const irProximoMes = () => {
    if (mesAtual === 11) {
      setMesAtual(0);
      setAnoAtual((a) => a + 1);
    } else {
      setMesAtual((m) => m + 1);
    }
  };

  const irHoje = () => {
    setMesAtual(hoje.getMonth());
    setAnoAtual(hoje.getFullYear());
  };

  const abrirNovoEvento = (dia, mes, ano) => {
    setDiaSelecionado(dia);
    setMesSelecionado(mes);
    setAnoSelecionado(ano);
    setEventoEditando(null);
    setModalAberto(true);
  };

  const abrirEditarEvento = (ev) => {
    setEventoEditando(ev);
    setDiaSelecionado(null);
    setModalAberto(true);
  };

  const abrirVerMais = (e, dia, mes, ano, lista) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const popWidth = 300;
    const popHeight = 340;

    let left = rect.left;
    let top = rect.bottom + 6;

    if (left + popWidth > window.innerWidth - 12) {
      left = window.innerWidth - popWidth - 12;
    }
    if (left < 12) {
      left = 12;
    }

    if (top + popHeight > window.innerHeight - 12) {
      const topAbove = rect.top - popHeight - 6;
      if (topAbove > 12) {
        top = topAbove;
      } else {
        top = Math.max(12, window.innerHeight - popHeight - 12);
      }
    }

    setPopoverDia({
      dia,
      mes,
      ano,
      eventos: lista,
      coords: { top, left },
    });
  };

  // Separação em linhas de 7 dias
  const linhas = useMemo(() => {
    const r = [];
    for (let i = 0; i < grade.length; i += 7) {
      r.push(grade.slice(i, i + 7));
    }
    return r;
  }, [grade]);

  // Lista de abas compactas com indicadores coloridos
  const ABAS_FILTRO = [
    { id: 'todos', label: 'Todos os eventos', dot: null },
    { id: 'reuniao', label: 'Reuniões', dot: 'bg-[#DB2777]' },
    { id: 'tarefa', label: 'Tarefas', dot: 'bg-[#2563EB]' },
    { id: 'lembrete', label: 'Lembretes', dot: 'bg-[#EA580C]' },
    { id: 'ligacao', label: 'Ligações', dot: 'bg-[#059669]' },
    { id: 'outro', label: 'Outros', dot: 'bg-[#CA8A04]' },
  ];

  // Contadores para o dropdown de filtro por categoria
  const contadoresPorTipo = useMemo(() => {
    const contagem = { todos: eventos.length };
    eventos.forEach((ev) => {
      const t = ev.tipo || 'outro';
      contagem[t] = (contagem[t] || 0) + 1;
    });
    return contagem;
  }, [eventos]);

  const abaAtivaObj = ABAS_FILTRO.find((a) => a.id === abaAtiva) || ABAS_FILTRO[0];

  return (
    <div className="w-full h-full flex-1 min-h-0 flex flex-col space-y-2.5">
      {/* ============================================================
          BARRA SUPERIOR CONSOLIDADA (EM UMA ÚNICA LINHA)
          - Esquerda: Mini Date Badge + Mês/Ano (2ª imagem)
          - Direita: Filtro Dropdown, Navegação, Visão, Adicionar e Pesquisa
      ============================================================ */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-2.5 flex-shrink-0">
        {/* Bloco Esquerdo (2ª imagem): Mini Date Badge + Mês & Ano + Intervalo */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="w-10 h-10 rounded-xl bg-white border border-[#E4ECE7] shadow-2xs flex flex-col items-center justify-center overflow-hidden flex-shrink-0">
            <div className="w-full bg-[#F7FAF8] border-b border-[#E4ECE7] text-[8px] font-extrabold text-[#687770] tracking-wider text-center py-0.5 uppercase">
              {MESES_ABREV[mesAtual]}
            </div>
            <div className="text-sm font-extrabold text-[#111915] leading-none pt-0.5">
              {hoje.getMonth() === mesAtual && hoje.getFullYear() === anoAtual ? hoje.getDate() : '01'}
            </div>
          </div>
          <div className="text-left">
            <h2 className="text-base sm:text-lg font-extrabold text-[#111915] tracking-tight leading-snug">
              {MESES[mesAtual]} {anoAtual}
            </h2>
            <p className="text-[11px] text-[#687770] font-medium">
              {formatarIntervaloMes(anoAtual, mesAtual)}
            </p>
          </div>
        </div>

        {/* Bloco Direito: Filtro por Categoria + Navegação + Visão + Adicionar + Busca */}
        <div className="flex items-center gap-2 flex-wrap xl:justify-end xl:ml-auto">
          {/* Dropdown de Filtro de Categoria com Contador */}
          <div ref={dropdownFiltroRef} className="relative flex-shrink-0">
            <button
              type="button"
              onClick={() => setDropdownFiltro(!dropdownFiltro)}
              className={`px-3 py-1.5 rounded-xl text-sm font-semibold flex items-center gap-2 border transition-all shadow-2xs ${
                abaAtiva !== 'todos'
                  ? 'bg-[#DCF5E4] text-[#0E382C] border-[#0E382C]'
                  : 'bg-white border-[#E4ECE7] text-[#111915] hover:bg-[#F7FAF8]'
              }`}
            >
              <HugeiconsIcon icon={FilterIcon} size={14} strokeWidth={2} className="text-[#687770]" />
              <div className="flex items-center gap-1.5">
                {abaAtivaObj.dot && <span className={`w-2 h-2 rounded-full ${abaAtivaObj.dot}`} />}
                <span>{abaAtiva === 'todos' ? 'Todas categorias' : abaAtivaObj.label}</span>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-[#F0F4F2] text-[#111915] rounded-full leading-none">
                {contadoresPorTipo[abaAtiva] || 0}
              </span>
              <HugeiconsIcon icon={ArrowDown01Icon} size={13} strokeWidth={2} />
            </button>

            {dropdownFiltro && (
              <div className="absolute right-0 mt-1 w-56 bg-surface-card border border-surface-border rounded-xl shadow-xl py-1.5 z-30 divide-y divide-surface-border">
                <div className="px-3.5 py-1 text-[10px] font-bold text-ink-secondary uppercase tracking-wider">
                  Filtrar por Categoria
                </div>
                <div className="py-1">
                  {ABAS_FILTRO.map((aba) => {
                    const ativo = abaAtiva === aba.id;
                    const qtd = contadoresPorTipo[aba.id] || 0;
                    return (
                      <button
                        key={aba.id}
                        type="button"
                        onClick={() => {
                          setAbaAtiva(aba.id);
                          setDropdownFiltro(false);
                        }}
                        className={`w-full text-left px-3.5 py-2 text-sm font-semibold transition-colors flex items-center justify-between hover:bg-surface-hover cursor-pointer ${
                          ativo ? 'bg-brand-accent/40 dark:bg-brand-primary/20 font-bold text-brand-primary dark:text-[#7DD3FC]' : 'text-ink-primary'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          {aba.dot ? (
                            <span className={`w-2 h-2 rounded-full ${aba.dot} flex-shrink-0`} />
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-ink-primary/30 flex-shrink-0" />
                          )}
                          <span className="truncate">{aba.label}</span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className="text-[10px] font-semibold text-ink-secondary bg-surface-subtle px-1.5 py-0.5 rounded-full border border-surface-border">
                            {qtd}
                          </span>
                          {ativo && <span className="text-brand-primary dark:text-[#7DD3FC] font-extrabold text-sm">✓</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Botões [< Hoje >] */}
          <div className="inline-flex items-center rounded-xl border border-[#E4ECE7] bg-white shadow-2xs overflow-hidden flex-shrink-0">
            <button
              type="button"
              onClick={irMesAnterior}
              className="p-1.5 hover:bg-[#F7FAF8] text-[#111915] transition-colors border-r border-[#E4ECE7]"
              title="Mês anterior"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} size={14} strokeWidth={2.2} />
            </button>
            <button
              type="button"
              onClick={irHoje}
              className="px-3 py-1.5 text-sm font-bold text-[#111915] hover:bg-[#F7FAF8] transition-colors border-r border-[#E4ECE7]"
            >
              Hoje
            </button>
            <button
              type="button"
              onClick={irProximoMes}
              className="p-1.5 hover:bg-[#F7FAF8] text-[#111915] transition-colors"
              title="Próximo mês"
            >
              <HugeiconsIcon icon={ArrowRight01Icon} size={14} strokeWidth={2.2} />
            </button>
          </div>

          {/* Dropdown de Visão */}
          <div ref={dropdownVisaoRef} className="relative flex-shrink-0">
            <button
              type="button"
              onClick={() => setDropdownVisao(!dropdownVisao)}
              className="px-3 py-1.5 bg-white border border-[#E4ECE7] rounded-xl text-sm font-semibold text-[#111915] hover:bg-[#F7FAF8] flex items-center gap-1.5 shadow-2xs transition-all"
            >
              <span>
                {visaoModo === 'mes'
                  ? 'Visão mensal'
                  : visaoModo === 'semana'
                  ? 'Visão semanal'
                  : 'Lista de eventos'}
              </span>
              <HugeiconsIcon icon={ArrowDown01Icon} size={13} strokeWidth={2} />
            </button>

            {dropdownVisao && (
              <div className="absolute right-0 mt-1 w-44 bg-white border border-[#E4ECE7] rounded-xl shadow-xl py-1 z-30">
                <button
                  type="button"
                  onClick={() => {
                    setVisaoModo('mes');
                    setDropdownVisao(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm font-semibold transition-colors flex items-center justify-between ${
                    visaoModo === 'mes'
                      ? 'bg-[#DCF5E4] text-[#0E382C]'
                      : 'text-[#111915] hover:bg-[#F7FAF8]'
                  }`}
                >
                  <span>Visão mensal</span>
                  {visaoModo === 'mes' && <span className="w-1.5 h-1.5 rounded-full bg-[#0E382C]" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setVisaoModo('semana');
                    setDropdownVisao(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm font-semibold transition-colors flex items-center justify-between ${
                    visaoModo === 'semana'
                      ? 'bg-[#DCF5E4] text-[#0E382C]'
                      : 'text-[#111915] hover:bg-[#F7FAF8]'
                  }`}
                >
                  <span>Visão semanal</span>
                  {visaoModo === 'semana' && <span className="w-1.5 h-1.5 rounded-full bg-[#0E382C]" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setVisaoModo('lista');
                    setDropdownVisao(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm font-semibold transition-colors flex items-center justify-between ${
                    visaoModo === 'lista'
                      ? 'bg-[#DCF5E4] text-[#0E382C]'
                      : 'text-[#111915] hover:bg-[#F7FAF8]'
                  }`}
                >
                  <span>Lista de eventos</span>
                  {visaoModo === 'lista' && <span className="w-1.5 h-1.5 rounded-full bg-[#0E382C]" />}
                </button>
              </div>
            )}
          </div>

          {/* Botão Primário: + Adicionar evento */}
          <button
            type="button"
            onClick={() => abrirNovoEvento(hoje.getDate(), hoje.getMonth(), hoje.getFullYear())}
            className="px-3.5 py-1.5 bg-[#0E382C] text-white hover:bg-[#07261E] rounded-xl text-sm font-bold flex items-center gap-1.5 shadow-xs transition-all flex-shrink-0"
          >
            <HugeiconsIcon icon={Add01Icon} size={15} strokeWidth={2.5} />
            <span>Adicionar evento</span>
          </button>

          {/* Barra de Pesquisa Rápida */}
          <div className="relative w-44 sm:w-52 flex-shrink-0">
            <HugeiconsIcon
              icon={Search01Icon}
              size={15}
              strokeWidth={2}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A9A92] pointer-events-none"
            />
            <input
              ref={inputBuscaRef}
              type="text"
              placeholder="Pesquisar..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-9 pr-10 py-1.5 bg-white border border-[#E4ECE7] rounded-xl text-sm text-[#111915] placeholder:text-[#8A9A92] focus:outline-none focus:border-[#0E382C] shadow-2xs transition-all"
            />
            <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-semibold text-[#8A9A92] bg-[#F7FAF8] border border-[#E4ECE7] rounded-md px-1.5 py-0.5 pointer-events-none select-none">
              ⌘K
            </kbd>
          </div>
        </div>
      </div>

      {/* ============================================================
          CARTÃO DO CALENDÁRIO: DIAS DA SEMANA E DIAS DIRETAMENTE
          Sem a barra interna anterior, liberando altura total para as células dos dias.
      ============================================================ */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#E4ECE7] shadow-[0_4px_24px_-4px_rgba(14,56,44,0.04)] overflow-hidden flex-1 min-h-0 flex flex-col">
        {visaoModo === 'mes' && (
          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <div className="w-full flex-1 min-h-0 flex flex-col overflow-hidden">
              {/* Linha dos Dias da Semana (Mon - Sun) */}
              <div className="grid grid-cols-7 border-b border-[#E4ECE7] bg-[#F7FAF8] divide-x divide-[#E4ECE7] flex-shrink-0">
                {DIAS_SEMANA.map((d) => (
                  <div key={d.curto} className="py-2.5 text-center text-sm font-semibold text-[#687770]">
                    {d.curto}
                  </div>
                ))}
              </div>

              {/* Grade de Células: Distribuição proporcional em 1fr por linha */}
              <div
                className="w-full flex-1 min-h-0 grid divide-y divide-[#E4ECE7]"
                style={{
                  gridTemplateRows: `repeat(${linhas.length}, minmax(0, 1fr))`,
                }}
              >
                {linhas.map((linha, i) => (
                  <div key={i} className="grid grid-cols-7 divide-x divide-[#E4ECE7] h-full">
                    {linha.map((celula) => (
                      <CelulaDia
                        key={`${celula.ano}-${celula.mes}-${celula.dia}`}
                        dia={celula.dia}
                        mes={celula.mes}
                        ano={celula.ano}
                        atual={celula.atual}
                        eventos={eventosDoDia(celula.dia, celula.mes, celula.ano)}
                        hoje={hoje}
                        onClicar={abrirNovoEvento}
                        onAbrirEvento={abrirEditarEvento}
                        onVerMais={abrirVerMais}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </DndContext>
        )}

        {/* ============================================================
            4. VISÃO SEMANAL OTIMIZADA
        ============================================================ */}
        {visaoModo === 'semana' && (
          <div className="flex-1 min-h-0 p-4 overflow-y-auto">
            <div className="h-full grid grid-cols-7 gap-2.5">
              {DIAS_SEMANA.map((diaInfo, idx) => {
                const dataBase = new Date(hoje);
                const diaSemanaHoje = (dataBase.getDay() + 6) % 7;
                dataBase.setDate(dataBase.getDate() - diaSemanaHoje + idx);

                const diaNum = dataBase.getDate();
                const mesNum = dataBase.getMonth();
                const anoNum = dataBase.getFullYear();
                const evs = eventosDoDia(diaNum, mesNum, anoNum);
                const eHoje = dataBase.toDateString() === hoje.toDateString();

                return (
                  <div
                    key={idx}
                    className="bg-[#F7FAF8] rounded-2xl p-2.5 border border-[#E4ECE7] flex flex-col space-y-2 h-full"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-[#E4ECE7] flex-shrink-0">
                      <span className="text-sm font-bold text-[#687770]">{diaInfo.curto}</span>
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                          eHoje ? 'bg-[#111915] text-white' : 'text-[#111915]'
                        }`}
                      >
                        {diaNum}
                      </span>
                    </div>

                    <div className="space-y-1.5 flex-1 min-h-0 overflow-y-auto pr-0.5">
                      {evs.map((ev) => (
                        <div key={ev.id} onClick={() => abrirEditarEvento(ev)} className="cursor-pointer">
                          <EventoArrastavel evento={ev} onClick={abrirEditarEvento} />
                        </div>
                      ))}
                      {evs.length === 0 && (
                        <p className="text-[10px] text-[#8A9A92] text-center pt-8">
                          Sem eventos
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => abrirNovoEvento(diaNum, mesNum, anoNum)}
                      className="w-full py-1.5 bg-white hover:bg-[#F0F4F2] border border-[#E4ECE7] rounded-xl text-[11px] font-semibold text-[#687770] transition-colors flex-shrink-0"
                    >
                      + Evento
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================================
            5. VISÃO EM LISTA
        ============================================================ */}
        {visaoModo === 'lista' && (
          <div className="flex-1 min-h-0 p-4 sm:p-5 overflow-y-auto">
            {eventosFiltrados.length === 0 ? (
              <div className="text-center py-12 text-sm text-[#687770]">
                Nenhum evento agendado para o período selecionado.
              </div>
            ) : (
              <div className="divide-y divide-[#E4ECE7]">
                {eventosFiltrados.map((ev) => {
                  const d = new Date(ev.data_inicio);
                  const tipo = TIPOS_EVENTO[ev.tipo] || TIPOS_EVENTO.outro;
                  const nomeNegocio = ev.metadata?.negocio_nome;
                  return (
                    <div
                      key={ev.id}
                      onClick={() => abrirEditarEvento(ev)}
                      className="py-3 px-3 hover:bg-[#F7FAF8] rounded-xl flex items-center justify-between gap-4 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`w-2.5 h-2.5 rounded-full ${tipo.dot} flex-shrink-0`} />
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-[#111915] truncate">{ev.titulo}</p>
                          <p className="text-[11px] text-[#687770] flex items-center gap-2 mt-0.5 flex-wrap">
                            <span>{d.toLocaleDateString('pt-BR', { dateStyle: 'medium' })}</span>
                            <span>•</span>
                            <span>
                              {pad2(d.getHours())}:{pad2(d.getMinutes())}
                            </span>
                            {nomeNegocio && (
                              <>
                                <span>•</span>
                                <span className="font-semibold text-[#0E382C] flex items-center gap-1">
                                  <HugeiconsIcon icon={Briefcase01Icon} size={11} />
                                  <span>{nomeNegocio}</span>
                                </span>
                              </>
                            )}
                            {ev.local && (
                              <>
                                <span>•</span>
                                <span className="truncate">{ev.local}</span>
                              </>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tipo.bg} ${tipo.border} ${tipo.text}`}
                        >
                          {tipo.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Principal de Criação e Edição (com Seletor de Negócio) */}
      <ModalEvento
        aberto={modalAberto}
        onFechar={() => {
          setModalAberto(false);
          setEventoEditando(null);
          setDiaSelecionado(null);
        }}
        onSalvar={handleSalvar}
        onExcluir={handleExcluir}
        eventoEditando={eventoEditando}
        diaSelecionado={diaSelecionado}
        mesSelecionado={mesSelecionado}
        anoSelecionado={anoSelecionado}
        tenantId={tenantId}
      />

      {/* Pop-up Flutuante ancorado ao lado do elemento do dia (SEM overlay escuro) */}
      {popoverDia && (
        <>
          {/* Backdrop transparente para capturar cliques fora e fechar sem escurecer a tela */}
          <div
            className="fixed inset-0 z-40 bg-transparent"
            onClick={() => setPopoverDia(null)}
          />

          {/* Card Flutuante posicionado dinamicamente ao lado do elemento do dia */}
          <div
            className="fixed z-50 bg-white rounded-2xl shadow-[0_12px_40px_-8px_rgba(14,56,44,0.18)] border border-[#E4ECE7] p-3.5 w-72 sm:w-80 space-y-2.5 animate-in fade-in zoom-in-95 duration-150"
            style={{
              top: `${popoverDia.coords.top}px`,
              left: `${popoverDia.coords.left}px`,
              maxHeight: 'min(420px, calc(100vh - 32px))',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabeçalho do Pop-up */}
            <div className="flex items-center justify-between pb-2 border-b border-[#E4ECE7]">
              <div>
                <h4 className="text-sm font-extrabold text-[#111915] flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[#111915] text-white text-[10px] flex items-center justify-center font-bold">
                    {popoverDia.dia}
                  </span>
                  <span>
                    {MESES[popoverDia.mes]} {popoverDia.ano}
                  </span>
                </h4>
                <p className="text-[10px] text-[#687770] font-medium mt-0.5">
                  {popoverDia.eventos.length} {popoverDia.eventos.length === 1 ? 'compromisso' : 'compromissos'} agendados
                </p>
              </div>

              <button
                type="button"
                onClick={() => setPopoverDia(null)}
                className="w-6 h-6 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-[#F7FAF8] flex items-center justify-center text-sm transition-colors"
                title="Fechar"
              >
                ✕
              </button>
            </div>

            {/* Lista dos eventos com scroll leve */}
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {popoverDia.eventos.map((ev) => {
                const tipo = TIPOS_EVENTO[ev.tipo] || TIPOS_EVENTO.outro;
                const d = new Date(ev.data_inicio);
                const horaStr = `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
                const nomeNegocio = ev.metadata?.negocio_nome;

                return (
                  <div
                    key={ev.id}
                    onClick={() => {
                      setPopoverDia(null);
                      abrirEditarEvento(ev);
                    }}
                    className={`p-2 rounded-xl border ${tipo.border} ${tipo.bg} hover:brightness-95 cursor-pointer transition-all flex items-start justify-between gap-2 shadow-2xs group`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${tipo.dot} flex-shrink-0`} />
                        <span className={`text-[9px] font-bold uppercase tracking-wider ${tipo.text}`}>
                          {tipo.label}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-[#111915] truncate group-hover:text-[#0E382C]">
                        {ev.titulo}
                      </p>
                      {nomeNegocio && (
                        <p className="text-[10px] font-semibold text-[#0E382C] flex items-center gap-1 mt-0.5">
                          <HugeiconsIcon icon={Briefcase01Icon} size={11} />
                          <span className="truncate">{nomeNegocio}</span>
                        </p>
                      )}
                    </div>
                    <span className={`text-[11px] font-bold ${tipo.text} flex-shrink-0 pt-0.5`}>
                      {horaStr}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Botão de Adicionar Novo Evento neste dia */}
            <div className="pt-2 border-t border-[#E4ECE7] flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const { dia, mes, ano } = popoverDia;
                  setPopoverDia(null);
                  abrirNovoEvento(dia, mes, ano);
                }}
                className="w-full py-1.5 px-3 bg-[#0E382C] hover:bg-[#07261E] text-white text-sm font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
              >
                <HugeiconsIcon icon={Add01Icon} size={14} strokeWidth={2.5} />
                <span>Novo evento neste dia</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Calendario;
