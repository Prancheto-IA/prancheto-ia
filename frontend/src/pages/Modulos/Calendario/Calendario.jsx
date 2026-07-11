import { useState, useEffect, useCallback } from 'react';
import { DndContext, PointerSensor, useSensor, useSensors, useDroppable, useDraggable } from '@dnd-kit/core';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../store/authStore';

const TIPOS_EVENTO = {
  reuniao:     { label: 'Reunião',    cor: '#6366f1', icone: '📅' },
  tarefa:      { label: 'Tarefa',     cor: '#10b981', icone: '✅' },
  lembrete:    { label: 'Lembrete',   cor: '#f59e0b', icone: '🔔' },
  ligacao:     { label: 'Ligação',    cor: '#3b82f6', icone: '📞' },
  outro:       { label: 'Outro',      cor: '#94a3b8', icone: '📌' },
};

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

const getDiasDoMes = (ano, mes) => {
  const primeiroDia = new Date(ano, mes, 1).getDay();
  const totalDias = new Date(ano, mes + 1, 0).getDate();
  return { primeiroDia, totalDias };
};

// ─── Modal de evento ──────────────────────────────────────────────────────────
const ModalEvento = ({ aberto, onFechar, onSalvar, onExcluir, eventoEditando, diaSelecionado, mesAtual, anoAtual }) => {
  const FORM_VAZIO = { titulo: '', tipo: 'reuniao', data_inicio: '', hora: '09:00', descricao: '', local: '' };
  const [form, setForm] = useState(FORM_VAZIO);

  useEffect(() => {
    if (eventoEditando) {
      const d = new Date(eventoEditando.data_inicio);
      setForm({
        titulo: eventoEditando.titulo || '',
        tipo: eventoEditando.tipo || 'reuniao',
        data_inicio: d.toISOString().split('T')[0],
        hora: d.toTimeString().slice(0, 5),
        descricao: eventoEditando.descricao || '',
        local: eventoEditando.local || '',
      });
    } else if (diaSelecionado) {
      const mes = String(mesAtual + 1).padStart(2, '0');
      const dia = String(diaSelecionado).padStart(2, '0');
      setForm({ ...FORM_VAZIO, data_inicio: `${anoAtual}-${mes}-${dia}` });
    } else {
      setForm(FORM_VAZIO);
    }
  }, [eventoEditando, diaSelecionado, mesAtual, anoAtual, aberto]);

  if (!aberto) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const dataHora = `${form.data_inicio}T${form.hora}:00`;
    await onSalvar({
      titulo: form.titulo,
      tipo: form.tipo,
      data_inicio: dataHora,
      descricao: form.descricao || null,
      local: form.local || null,
    });
    onFechar();
  };

  const inp = 'w-full px-3 py-2 rounded-lg text-sm border border-white/10 bg-white/5 focus:outline-none focus:border-primary-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onFechar}>
      <div className="w-full max-w-md rounded-2xl p-6 space-y-4" style={{ backgroundColor: 'var(--color-surface)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">{eventoEditando ? 'Editar evento' : 'Novo evento'}</h2>
          <button onClick={onFechar} className="opacity-50 hover:opacity-100 text-xl">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input className={inp} placeholder="Título do evento" value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} required />
          <div className="grid grid-cols-2 gap-3">
            <select className={inp} value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
              {Object.entries(TIPOS_EVENTO).map(([k, v]) => (
                <option key={k} value={k}>{v.icone} {v.label}</option>
              ))}
            </select>
            <input type="time" className={inp} value={form.hora} onChange={e => setForm(f => ({ ...f, hora: e.target.value }))} />
          </div>
          <input type="date" className={inp} value={form.data_inicio} onChange={e => setForm(f => ({ ...f, data_inicio: e.target.value }))} required />
          <input className={inp} placeholder="Local (opcional)" value={form.local} onChange={e => setForm(f => ({ ...f, local: e.target.value }))} />
          <textarea className={inp} placeholder="Descrição (opcional)" rows={2} value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} />
          <div className="flex gap-2 pt-2">
            {eventoEditando && (
              <button type="button" onClick={() => { onExcluir(eventoEditando.id); onFechar(); }}
                className="px-4 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                Excluir
              </button>
            )}
            <button type="button" onClick={onFechar} className="flex-1 px-4 py-2 rounded-lg text-sm border border-white/10 hover:bg-white/5">Cancelar</button>
            <button type="submit" className="flex-1 px-4 py-2 rounded-lg text-sm bg-primary-600 hover:bg-primary-500 font-medium">Salvar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Evento arrastável ────────────────────────────────────────────────────────
const EventoArrastavel = ({ evento, onClick }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: evento.id });
  const tipo = TIPOS_EVENTO[evento.tipo] || TIPOS_EVENTO.outro;
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={(e) => { e.stopPropagation(); onClick(evento); }}
      className="text-xs px-1.5 py-0.5 rounded truncate cursor-grab active:cursor-grabbing select-none"
      style={{
        backgroundColor: tipo.cor + '33',
        color: tipo.cor,
        opacity: isDragging ? 0.4 : 1,
      }}
      title={evento.titulo}
    >
      {tipo.icone} {evento.titulo}
    </div>
  );
};

// ─── Célula do dia (droppable) ────────────────────────────────────────────────
const CelulaDia = ({ dia, mes, ano, eventos, hoje, onClicar, onAbrirEvento }) => {
  const { setNodeRef, isOver } = useDroppable({ id: `dia-${ano}-${mes}-${dia}` });
  const eHoje = hoje.getDate() === dia && hoje.getMonth() === mes && hoje.getFullYear() === ano;

  return (
    <div
      ref={setNodeRef}
      onClick={() => onClicar(dia)}
      className={`min-h-[80px] p-1.5 rounded-lg cursor-pointer transition-colors ${
        isOver ? 'bg-primary-500/20 ring-1 ring-primary-500' : 'hover:bg-white/5'
      }`}
    >
      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium mb-1 ${
        eHoje ? 'bg-primary-500 text-white' : 'opacity-70'
      }`}>
        {dia}
      </div>
      <div className="space-y-0.5">
        {eventos.slice(0, 3).map(ev => (
          <EventoArrastavel key={ev.id} evento={ev} onClick={onAbrirEvento} />
        ))}
        {eventos.length > 3 && (
          <p className="text-xs opacity-40 pl-1">+{eventos.length - 3} mais</p>
        )}
      </div>
    </div>
  );
};

// ─── Página principal ─────────────────────────────────────────────────────────
const Calendario = () => {
  const usuario = useAuthStore(s => s.usuario);
  const [eventos, setEventos] = useState([]);
  const [mesAtual, setMesAtual] = useState(new Date().getMonth());
  const [anoAtual, setAnoAtual] = useState(new Date().getFullYear());
  const [modalAberto, setModalAberto] = useState(false);
  const [diaSelecionado, setDiaSelecionado] = useState(null);
  const [eventoEditando, setEventoEditando] = useState(null);
  const hoje = new Date();

  const tenantId = usuario?.tenant_id;

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const carregar = useCallback(async () => {
    if (!tenantId) return;
    const inicio = new Date(anoAtual, mesAtual, 1).toISOString();
    const fim = new Date(anoAtual, mesAtual + 1, 0, 23, 59, 59).toISOString();
    const { data } = await supabase
      .from('agenda_eventos')
      .select('*')
      .eq('tenant_id', tenantId)
      .gte('data_inicio', inicio)
      .lte('data_inicio', fim)
      .order('data_inicio', { ascending: true });
    setEventos(data || []);
  }, [tenantId, mesAtual, anoAtual]);

  useEffect(() => { carregar(); }, [carregar]);

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

  const handleExcluir = async (id) => {
    await supabase.from('agenda_eventos').delete().eq('id', id);
    await carregar();
  };

  const handleDragEnd = async ({ active, over }) => {
    if (!over) return;
    const overId = over.id; // formato: "dia-YYYY-MM-DD"
    if (!overId.startsWith('dia-')) return;

    const [, ano, mes, dia] = overId.split('-');
    const evento = eventos.find(e => e.id === active.id);
    if (!evento) return;

    const dataOriginal = new Date(evento.data_inicio);
    const novaData = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia),
      dataOriginal.getHours(), dataOriginal.getMinutes());

    await supabase
      .from('agenda_eventos')
      .update({ data_inicio: novaData.toISOString() })
      .eq('id', evento.id);
    await carregar();
  };

  const { primeiroDia, totalDias } = getDiasDoMes(anoAtual, mesAtual);

  const eventosDoDia = (dia) =>
    eventos.filter(e => {
      const d = new Date(e.data_inicio);
      return d.getDate() === dia && d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
    });

  const irMesAnterior = () => {
    if (mesAtual === 0) { setMesAtual(11); setAnoAtual(a => a - 1); }
    else setMesAtual(m => m - 1);
  };

  const irProximoMes = () => {
    if (mesAtual === 11) { setMesAtual(0); setAnoAtual(a => a + 1); }
    else setMesAtual(m => m + 1);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{MESES[mesAtual]} {anoAtual}</h1>
          <p className="text-sm opacity-50">Arraste eventos para reagendar</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={irMesAnterior} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors">‹</button>
          <button onClick={() => { setMesAtual(hoje.getMonth()); setAnoAtual(hoje.getFullYear()); }}
            className="px-3 py-1.5 rounded-lg text-sm hover:bg-white/10 transition-colors">Hoje</button>
          <button onClick={irProximoMes} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors">›</button>
          <button
            onClick={() => { setEventoEditando(null); setDiaSelecionado(hoje.getDate()); setModalAberto(true); }}
            className="ml-2 px-4 py-2 rounded-lg text-sm bg-primary-600 hover:bg-primary-500 font-medium"
          >
            + Evento
          </button>
        </div>
      </div>

      {/* Grade do calendário */}
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="rounded-xl overflow-hidden border border-white/10">
          {/* Cabeçalho dos dias */}
          <div className="grid grid-cols-7 border-b border-white/10">
            {DIAS_SEMANA.map(d => (
              <div key={d} className="py-2 text-center text-xs font-medium opacity-50">{d}</div>
            ))}
          </div>
          {/* Células */}
          <div className="grid grid-cols-7 gap-px bg-white/5">
            {/* Células vazias antes do primeiro dia */}
            {Array.from({ length: primeiroDia }).map((_, i) => (
              <div key={`vazio-${i}`} className="min-h-[80px] p-1.5" style={{ backgroundColor: 'var(--color-surface)' }} />
            ))}
            {/* Dias do mês */}
            {Array.from({ length: totalDias }).map((_, i) => {
              const dia = i + 1;
              return (
                <div key={dia} style={{ backgroundColor: 'var(--color-surface)' }}>
                  <CelulaDia
                    dia={dia}
                    mes={mesAtual}
                    ano={anoAtual}
                    eventos={eventosDoDia(dia)}
                    hoje={hoje}
                    onClicar={(d) => { setDiaSelecionado(d); setEventoEditando(null); setModalAberto(true); }}
                    onAbrirEvento={(ev) => { setEventoEditando(ev); setDiaSelecionado(null); setModalAberto(true); }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </DndContext>

      {/* Legenda */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(TIPOS_EVENTO).map(([k, v]) => (
          <div key={k} className="flex items-center gap-1.5 text-xs opacity-60">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: v.cor }} />
            {v.label}
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
        mesAtual={mesAtual}
        anoAtual={anoAtual}
      />
    </div>
  );
};

export default Calendario;
