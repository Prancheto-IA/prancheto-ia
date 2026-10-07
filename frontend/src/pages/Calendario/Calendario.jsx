// =============================================================
// PRANCHETO.IA - MÓDULO DE CALENDÁRIO (EMITLY DESIGN SYSTEM)
// Calendário mensal interativo com drag-and-drop, sem emojis e com abas limpas.
// =============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { DndContext, PointerSensor, useSensor, useSensors, useDroppable, useDraggable } from '@dnd-kit/core';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';

const TIPOS_EVENTO = {
  reuniao:     { label: 'Reunião',    cor: '#0E382C' },
  tarefa:      { label: 'Tarefa',     cor: '#15803D' },
  lembrete:    { label: 'Lembrete',   cor: '#B45309' },
  ligacao:     { label: 'Ligação',    cor: '#2563EB' },
  outro:       { label: 'Outro',      cor: '#687770' },
};

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

const pad2 = (n) => String(n).padStart(2, '0');

const getGradeDoMes = (ano, mes) => {
  const primeiroDiaMes = new Date(ano, mes, 1);
  const diaSemanaInicio = primeiroDiaMes.getDay();
  const totalDiasMes = new Date(ano, mes + 1, 0).getDate();
  const totalDiasMesAnterior = new Date(ano, mes, 0).getDate();

  const dias = [];

  for (let i = diaSemanaInicio - 1; i >= 0; i--) {
    const dia = totalDiasMesAnterior - i;
    const mesRef = mes === 0 ? 11 : mes - 1;
    const anoRef = mes === 0 ? ano - 1 : ano;
    dias.push({ dia, mes: mesRef, ano: anoRef, atual: false });
  }

  for (let dia = 1; dia <= totalDiasMes; dia++) {
    dias.push({ dia, mes, ano, atual: true });
  }

  const diasRestantes = (7 - (dias.length % 7)) % 7;
  for (let dia = 1; dia <= diasRestantes; dia++) {
    const mesRef = mes === 11 ? 0 : mes + 1;
    const anoRef = mes === 11 ? ano + 1 : ano;
    dias.push({ dia, mes: mesRef, ano: anoRef, atual: false });
  }

  return dias;
};

const formatarDataHora = (iso) => {
  const d = new Date(iso);
  const dataStr = d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });
  return `${dataStr} · ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
};

const FORM_VAZIO = { titulo: '', tipo: 'reuniao', data_inicio: '', hora: '09:00', descricao: '', local: '' };

const ModalEvento = ({ aberto, onFechar, onSalvar, onExcluir, eventoEditando, diaSelecionado, mesSelecionado, anoSelecionado }) => {
  const [form, setForm] = useState(FORM_VAZIO);

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
      });
    } else if (diaSelecionado) {
      const mes = pad2(mesSelecionado + 1);
      const dia = pad2(diaSelecionado);
      setForm({ ...FORM_VAZIO, data_inicio: `${anoSelecionado}-${mes}-${dia}` });
    } else {
      setForm(FORM_VAZIO);
    }
  }, [eventoEditando, diaSelecionado, mesSelecionado, anoSelecionado, aberto]);

  if (!aberto) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const [ano, mes, dia] = form.data_inicio.split('-').map(Number);
    const [hora, minuto] = form.hora.split(':').map(Number);
    const dataHora = new Date(ano, mes - 1, dia, hora, minuto);

    await onSalvar({
      titulo: form.titulo,
      tipo: form.tipo,
      data_inicio: dataHora.toISOString(),
      descricao: form.descricao || null,
      local: form.local || null,
    });
    onFechar();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4" onClick={onFechar}>
      <div className="w-full max-w-md bg-white rounded-2xl p-6 space-y-4 shadow-2xl border border-[#E4ECE7]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between pb-3 border-b border-[#E4ECE7]">
          <h2 className="text-base font-extrabold text-[#111915]">{eventoEditando ? 'Editar Evento' : 'Novo Evento'}</h2>
          <button onClick={onFechar} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-[#111915] mb-1">Título do Evento *</label>
            <input
              className="w-full px-3.5 py-2.5 bg-[#F7FAF8] border border-[#E4ECE7] rounded-xl text-xs text-[#111915] focus:outline-none focus:border-[#0E382C]"
              placeholder="Ex: Reunião de Alinhamento de Produto"
              value={form.titulo}
              onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#111915] mb-1">Tipo</label>
              <select
                className="w-full px-3.5 py-2.5 bg-[#F7FAF8] border border-[#E4ECE7] rounded-xl text-xs text-[#111915]"
                value={form.tipo}
                onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
              >
                {Object.entries(TIPOS_EVENTO).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#111915] mb-1">Horário</label>
              <input
                type="time"
                className="w-full px-3.5 py-2.5 bg-[#F7FAF8] border border-[#E4ECE7] rounded-xl text-xs text-[#111915]"
                value={form.hora}
                onChange={e => setForm(f => ({ ...f, hora: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#111915] mb-1">Data *</label>
            <input
              type="date"
              className="w-full px-3.5 py-2.5 bg-[#F7FAF8] border border-[#E4ECE7] rounded-xl text-xs text-[#111915]"
              value={form.data_inicio}
              onChange={e => setForm(f => ({ ...f, data_inicio: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#111915] mb-1">Local / Link</label>
            <input
              className="w-full px-3.5 py-2.5 bg-[#F7FAF8] border border-[#E4ECE7] rounded-xl text-xs text-[#111915]"
              placeholder="Google Meet ou endereço"
              value={form.local}
              onChange={e => setForm(f => ({ ...f, local: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#111915] mb-1">Descrição</label>
            <textarea
              className="w-full px-3.5 py-2.5 bg-[#F7FAF8] border border-[#E4ECE7] rounded-xl text-xs text-[#111915]"
              placeholder="Pauta da reunião ou anotações"
              rows={2}
              value={form.descricao}
              onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
            />
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-[#E4ECE7]">
            {eventoEditando && (
              <button
                type="button"
                onClick={() => { onExcluir(eventoEditando.id); onFechar(); }}
                className="text-xs font-semibold text-red-600 hover:underline"
              >
                Excluir
              </button>
            )}
            <div className="flex gap-2 ml-auto">
              <button
                type="button"
                onClick={onFechar}
                className="px-4 py-2 bg-[#F7FAF8] border border-[#E4ECE7] text-[#687770] text-xs font-semibold rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#0E382C] text-white text-xs font-semibold rounded-xl shadow-xs hover:bg-[#07261E]"
              >
                Salvar
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

const EventoArrastavel = ({ evento, onClick }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: evento.id });
  const tipo = TIPOS_EVENTO[evento.tipo] || TIPOS_EVENTO.outro;
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={(e) => { e.stopPropagation(); onClick(evento); }}
      className="text-[10px] font-bold px-2 py-1 rounded-lg truncate cursor-grab active:cursor-grabbing select-none transition-all"
      style={{
        backgroundColor: tipo.cor + '15',
        color: tipo.cor,
        borderLeft: `3px solid ${tipo.cor}`,
        opacity: isDragging ? 0.4 : 1,
      }}
      title={evento.titulo}
    >
      {evento.titulo}
    </div>
  );
};

const CelulaDia = ({ dia, mes, ano, atual, eventos, hoje, onClicar, onAbrirEvento }) => {
  const { setNodeRef, isOver } = useDroppable({ id: `dia-${ano}-${mes}-${dia}` });
  const eHoje = hoje.getDate() === dia && hoje.getMonth() === mes && hoje.getFullYear() === ano;

  return (
    <div
      ref={setNodeRef}
      onClick={() => onClicar(dia, mes, ano)}
      className={`min-h-[100px] p-2 bg-white transition-colors cursor-pointer border-r border-b border-[#E4ECE7] ${
        isOver ? 'bg-[#D4EC9D]/20' : 'hover:bg-[#F7FAF8]'
      } ${atual ? '' : 'opacity-30 bg-slate-50'}`}
    >
      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mb-1.5 ${
        eHoje ? 'bg-[#0E382C] text-[#D4EC9D]' : 'text-[#111915]'
      }`}>
        {dia}
      </div>
      <div className="space-y-1">
        {eventos.slice(0, 3).map(ev => (
          <EventoArrastavel key={ev.id} evento={ev} onClick={onAbrirEvento} />
        ))}
        {eventos.length > 3 && (
          <p className="text-[10px] text-[#687770] font-bold pl-1">+{eventos.length - 3} mais</p>
        )}
      </div>
    </div>
  );
};

const PainelProximos = ({ eventos, onAbrirEvento }) => (
  <div className="w-full lg:w-80 flex-shrink-0 bg-white rounded-2xl border border-[#E4ECE7] p-5 space-y-3 shadow-xs">
    <h2 className="font-extrabold text-sm text-[#111915]">Próximos Compromissos</h2>
    {eventos.length === 0 ? (
      <p className="text-xs text-[#687770] py-6 text-center">Nenhum compromisso agendado.</p>
    ) : (
      <div className="space-y-2">
        {eventos.map(ev => {
          const tipo = TIPOS_EVENTO[ev.tipo] || TIPOS_EVENTO.outro;
          return (
            <button
              key={ev.id}
              onClick={() => onAbrirEvento(ev)}
              className="w-full flex items-start gap-3 p-2.5 rounded-xl border border-[#E4ECE7] bg-[#F7FAF8] hover:bg-white text-left transition-all"
            >
              <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: tipo.cor }} />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-[#111915] truncate">{ev.titulo}</p>
                <p className="text-[10px] text-[#687770]">{formatarDataHora(ev.data_inicio)}</p>
              </div>
            </button>
          );
        })}
      </div>
    )}
  </div>
);

const Calendario = () => {
  const usuario = useAuthStore(s => s.usuario);
  const [eventos, setEventos] = useState([]);
  const [proximosEventos, setProximosEventos] = useState([]);
  const [mesAtual, setMesAtual] = useState(new Date().getMonth());
  const [anoAtual, setAnoAtual] = useState(new Date().getFullYear());
  const [modalAberto, setModalAberto] = useState(false);
  const [diaSelecionado, setDiaSelecionado] = useState(null);
  const [mesSelecionado, setMesSelecionado] = useState(mesAtual);
  const [anoSelecionado, setAnoSelecionado] = useState(anoAtual);
  const [eventoEditando, setEventoEditando] = useState(null);
  const hoje = new Date();

  const tenantId = usuario?.tenant_id;
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const grade = getGradeDoMes(anoAtual, mesAtual);
  const primeiraCelula = grade[0];
  const ultimaCelula = grade[grade.length - 1];

  const carregar = useCallback(async () => {
    if (!tenantId) return;
    const inicio = new Date(primeiraCelula.ano, primeiraCelula.mes, primeiraCelula.dia).toISOString();
    const fim = new Date(ultimaCelula.ano, ultimaCelula.mes, ultimaCelula.dia, 23, 59, 59).toISOString();
    const { data } = await supabase
      .from('agenda_eventos')
      .select('*')
      .eq('tenant_id', tenantId)
      .gte('data_inicio', inicio)
      .lte('data_inicio', fim)
      .order('data_inicio', { ascending: true });
    setEventos(data || []);
  }, [tenantId, primeiraCelula.ano, primeiraCelula.mes, primeiraCelula.dia, ultimaCelula.ano, ultimaCelula.mes, ultimaCelula.dia]);

  useEffect(() => { carregar(); }, [carregar]);

  const carregarProximos = useCallback(async () => {
    if (!tenantId) return;
    const { data } = await supabase
      .from('agenda_eventos')
      .select('*')
      .eq('tenant_id', tenantId)
      .neq('status', 'cancelado')
      .gte('data_inicio', new Date().toISOString())
      .order('data_inicio', { ascending: true })
      .limit(8);
    setProximosEventos(data || []);
  }, [tenantId]);

  useEffect(() => { carregarProximos(); }, [carregarProximos]);

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
    await Promise.all([carregar(), carregarProximos()]);
  };

  const handleExcluir = async (id) => {
    await supabase.from('agenda_eventos').delete().eq('id', id);
    await Promise.all([carregar(), carregarProximos()]);
  };

  const handleDragEnd = async ({ active, over }) => {
    if (!over) return;
    const overId = String(over.id);
    if (!overId.startsWith('dia-')) return;

    const [, ano, mes, dia] = overId.split('-');
    const evento = eventos.find(e => e.id === active.id);
    if (!evento) return;

    const dataOriginal = new Date(evento.data_inicio);
    const novaData = new Date(parseInt(ano), parseInt(mes), parseInt(dia),
      dataOriginal.getHours(), dataOriginal.getMinutes());

    await supabase
      .from('agenda_eventos')
      .update({ data_inicio: novaData.toISOString() })
      .eq('id', evento.id);
    await Promise.all([carregar(), carregarProximos()]);
  };

  const eventosDoDia = (dia, mes, ano) =>
    eventos.filter(e => {
      const d = new Date(e.data_inicio);
      return d.getDate() === dia && d.getMonth() === mes && d.getFullYear() === ano;
    });

  const irMesAnterior = () => {
    if (mesAtual === 0) { setMesAtual(11); setAnoAtual(a => a - 1); }
    else setMesAtual(m => m - 1);
  };

  const irProximoMes = () => {
    if (mesAtual === 11) { setMesAtual(0); setAnoAtual(a => a + 1); }
    else setMesAtual(m => m + 1);
  };

  const irHoje = () => { setMesAtual(hoje.getMonth()); setAnoAtual(hoje.getFullYear()); };

  const abrirNovoEvento = (dia, mes, ano) => {
    setDiaSelecionado(dia);
    setMesSelecionado(mes);
    setAnoSelecionado(ano);
    setEventoEditando(null);
    setModalAberto(true);
  };

  const linhas = [];
  for (let i = 0; i < grade.length; i += 7) linhas.push(grade.slice(i, i + 7));

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-[#111915]">{MESES[mesAtual]} {anoAtual}</h1>
          <p className="text-xs text-[#687770]">Arraste compromissos entre as células para alterar horários</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={irMesAnterior} className="p-2 bg-white border border-[#E4ECE7] rounded-xl text-xs font-bold text-[#111915] hover:bg-[#F7FAF8]">
            ←
          </button>
          <button onClick={irHoje} className="px-3 py-2 bg-[#D4EC9D] text-[#132E22] text-xs font-bold rounded-xl shadow-xs">
            Hoje
          </button>
          <button onClick={irProximoMes} className="p-2 bg-white border border-[#E4ECE7] rounded-xl text-xs font-bold text-[#111915] hover:bg-[#F7FAF8]">
            →
          </button>
          <button
            onClick={() => abrirNovoEvento(hoje.getDate(), hoje.getMonth(), hoje.getFullYear())}
            className="ml-2 px-4 py-2 bg-[#0E382C] text-white font-semibold text-xs rounded-xl shadow-xs hover:bg-[#07261E]"
          >
            + Evento
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Calendar Grid */}
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="flex-1 min-w-0 bg-white rounded-2xl border border-[#E4ECE7] overflow-hidden shadow-xs">
            <div className="grid grid-cols-7 border-b border-[#E4ECE7] bg-[#F7FAF8]">
              {DIAS_SEMANA.map(d => (
                <div key={d} className="py-2.5 text-center text-xs font-bold text-[#687770]">{d}</div>
              ))}
            </div>
            <div>
              {linhas.map((linha, i) => (
                <div key={i} className="grid grid-cols-7">
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
                      onAbrirEvento={(ev) => { setEventoEditando(ev); setDiaSelecionado(null); setModalAberto(true); }}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </DndContext>

        {/* Next Events Sidebar */}
        <PainelProximos
          eventos={proximosEventos}
          onAbrirEvento={(ev) => { setEventoEditando(ev); setDiaSelecionado(null); setModalAberto(true); }}
        />
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 pt-2">
        {Object.entries(TIPOS_EVENTO).map(([k, v]) => (
          <div key={k} className="flex items-center gap-2 text-xs font-semibold text-[#687770]">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: v.cor }} />
            <span>{v.label}</span>
          </div>
        ))}
      </div>

      <ModalEvento
        aberto={modalAberto}
        onFechar={() => { setModalAberto(false); setEventoEditando(null); setDiaSelecionado(null); }}
        onSalvar={handleSalvar}
        onExcluir={handleExcluir}
        eventoEditando={eventoEditando}
        diaSelecionado={diaSelecionado}
        mesSelecionado={mesSelecionado}
        anoSelecionado={anoSelecionado}
      />
    </div>
  );
};

export default Calendario;
