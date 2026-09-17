import { useState, useEffect, useCallback } from 'react';
import { DndContext, PointerSensor, useSensor, useSensors, useDroppable, useDraggable } from '@dnd-kit/core';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';

const TIPOS_EVENTO = {
  reuniao:     { label: 'Reunião',    cor: '#6366f1', icone: '📅' },
  tarefa:      { label: 'Tarefa',     cor: '#10b981', icone: '✅' },
  lembrete:    { label: 'Lembrete',   cor: '#f59e0b', icone: '🔔' },
  ligacao:     { label: 'Ligação',    cor: '#3b82f6', icone: '📞' },
  outro:       { label: 'Outro',      cor: '#94a3b8', icone: '📌' },
};

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

const pad2 = (n) => String(n).padStart(2, '0');

// Monta a grade completa do mês (linhas de 7 dias), preenchendo com dias do
// mês anterior/seguinte para fechar a primeira e a última semana — igual ao
// que qualquer calendário mensal padrão mostra (dias fora do mês, esmaecidos).
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

// ─── Modal de evento ──────────────────────────────────────────────────────────
// FORM_VAZIO fora do componente: referência estável entre renders, para
// poder entrar na dependência do useEffect abaixo sem causar loop.
const FORM_VAZIO = { titulo: '', tipo: 'reuniao', data_inicio: '', hora: '09:00', descricao: '', local: '' };

const ModalEvento = ({ aberto, onFechar, onSalvar, onExcluir, eventoEditando, diaSelecionado, mesSelecionado, anoSelecionado }) => {
  const [form, setForm] = useState(FORM_VAZIO);

  useEffect(() => {
    if (eventoEditando) {
      // Base local consistente: getters locais para data E hora, evitando
      // misturar UTC (toISOString) com hora local (toTimeString) — a mistura
      // fazia eventos perto da meia-noite local caírem no dia/hora errados.
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
    // Constrói um Date local real e converte pra instante UTC via
    // toISOString(). Concatenar a string naive ("YYYY-MM-DDTHH:mm:00") e
    // mandar direto pro Postgres fazia o timestamptz ser interpretado como
    // UTC, deslocando o evento pelo fuso do usuário (ex.: 3h no Brasil).
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

  const inp = 'w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-primary-500';
  const inpStyle = { border: '1px solid var(--color-surface-border)', backgroundColor: 'var(--color-surface-card)' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onFechar}>
      <div className="w-full max-w-md rounded-2xl p-6 space-y-4" style={{ backgroundColor: 'var(--color-surface)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">{eventoEditando ? 'Editar evento' : 'Novo evento'}</h2>
          <button onClick={onFechar} className="opacity-50 hover:opacity-100 text-xl">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input className={inp} style={inpStyle} placeholder="Título do evento" value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} required />
          <div className="grid grid-cols-2 gap-3">
            <select className={inp} style={inpStyle} value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
              {Object.entries(TIPOS_EVENTO).map(([k, v]) => (
                <option key={k} value={k}>{v.icone} {v.label}</option>
              ))}
            </select>
            <input type="time" className={inp} style={inpStyle} value={form.hora} onChange={e => setForm(f => ({ ...f, hora: e.target.value }))} />
          </div>
          <input type="date" className={inp} style={inpStyle} value={form.data_inicio} onChange={e => setForm(f => ({ ...f, data_inicio: e.target.value }))} required />
          <input className={inp} style={inpStyle} placeholder="Local (opcional)" value={form.local} onChange={e => setForm(f => ({ ...f, local: e.target.value }))} />
          <textarea className={inp} style={inpStyle} placeholder="Descrição (opcional)" rows={2} value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} />
          <div className="flex gap-2 pt-2">
            {eventoEditando && (
              <button type="button" onClick={() => { onExcluir(eventoEditando.id); onFechar(); }}
                className="px-4 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                Excluir
              </button>
            )}
            <button type="button" onClick={onFechar} className="flex-1 px-4 py-2 rounded-lg text-sm transition-colors"
              style={{ border: '1px solid var(--color-surface-border)' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}>Cancelar</button>
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
// O id embute o mês/ano reais da célula (já 0-indexado, convenção Date.getMonth()),
// inclusive para dias esmaecidos de mês adjacente — o handler de drop usa esse
// valor diretamente, sem reindexar.
const CelulaDia = ({ dia, mes, ano, atual, eventos, hoje, onClicar, onAbrirEvento }) => {
  const { setNodeRef, isOver } = useDroppable({ id: `dia-${ano}-${mes}-${dia}` });
  const eHoje = hoje.getDate() === dia && hoje.getMonth() === mes && hoje.getFullYear() === ano;

  return (
    <div
      ref={setNodeRef}
      onClick={() => onClicar(dia, mes, ano)}
      className={`min-h-[92px] p-1.5 rounded-lg cursor-pointer transition-colors ${
        isOver ? 'bg-primary-500/20 ring-1 ring-primary-500' : 'hover:bg-white/5'
      } ${atual ? '' : 'opacity-40'}`}
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

// ─── Painel de próximos compromissos ──────────────────────────────────────────
const PainelProximos = ({ eventos, onAbrirEvento }) => (
  <div className="w-full lg:w-72 flex-shrink-0 rounded-xl border p-4 space-y-3" style={{ borderColor: 'var(--color-surface-border)' }}>
    <h2 className="font-semibold text-sm">Próximos compromissos</h2>
    {eventos.length === 0 ? (
      <p className="text-xs opacity-40 py-4 text-center">Nenhum compromisso futuro agendado.</p>
    ) : (
      <div className="space-y-1">
        {eventos.map(ev => {
          const tipo = TIPOS_EVENTO[ev.tipo] || TIPOS_EVENTO.outro;
          return (
            <button
              key={ev.id}
              onClick={() => onAbrirEvento(ev)}
              className="w-full flex items-start gap-2 p-2 rounded-lg text-left transition-colors hover:bg-white/5"
            >
              <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: tipo.cor }} />
              <div className="min-w-0 flex-1">
                <p className="text-sm truncate">{ev.titulo}</p>
                <p className="text-xs opacity-50">{formatarDataHora(ev.data_inicio)}</p>
              </div>
            </button>
          );
        })}
      </div>
    )}
  </div>
);

// ─── Página principal ─────────────────────────────────────────────────────────
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
    // Cobre a grade inteira (incluindo dias de padding do mês anterior/seguinte),
    // não só o mês exibido, para os eventos desses dias também aparecerem.
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

  // Painel "Próximos compromissos": independente do mês navegado, sempre
  // mostra o que vem pela frente a partir de agora.
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
    const overId = String(over.id); // formato: "dia-YYYY-M-D", mês já 0-indexado
    if (!overId.startsWith('dia-')) return;

    const [, ano, mes, dia] = overId.split('-');
    const evento = eventos.find(e => e.id === active.id);
    if (!evento) return;

    const dataOriginal = new Date(evento.data_inicio);
    // `mes` já vem 0-indexado (mesma convenção do id da célula) — não subtrair
    // 1 de novo, senão janeiro (mes="0") vira dezembro do ano anterior.
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
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{MESES[mesAtual]} {anoAtual}</h1>
          <p className="text-sm opacity-50">Arraste eventos para reagendar</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={irMesAnterior}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}>‹</button>
          <button onClick={irHoje}
            className="px-3 py-1.5 rounded-lg text-sm transition-colors"
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}>Hoje</button>
          <button onClick={irProximoMes}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}>›</button>
          <button
            onClick={() => abrirNovoEvento(hoje.getDate(), hoje.getMonth(), hoje.getFullYear())}
            className="ml-2 px-4 py-2 rounded-lg text-sm bg-primary-600 hover:bg-primary-500 font-medium"
          >
            + Evento
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Grade do calendário */}
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="flex-1 min-w-0 rounded-xl overflow-hidden border" style={{ borderColor: 'var(--color-surface-border)' }}>
            {/* Cabeçalho dos dias */}
            <div className="grid grid-cols-7 border-b" style={{ borderColor: 'var(--color-surface-border)' }}>
              {DIAS_SEMANA.map(d => (
                <div key={d} className="py-2 text-center text-xs font-medium opacity-50">{d}</div>
              ))}
            </div>
            {/* Semanas */}
            <div className="divide-y" style={{ borderColor: 'var(--color-surface-border)' }}>
              {linhas.map((linha, i) => (
                <div key={i} className="grid grid-cols-7 gap-px" style={{ backgroundColor: 'var(--color-surface-border)' }}>
                  {linha.map((celula) => (
                    <div key={`${celula.ano}-${celula.mes}-${celula.dia}`} style={{ backgroundColor: 'var(--color-surface)' }}>
                      <CelulaDia
                        dia={celula.dia}
                        mes={celula.mes}
                        ano={celula.ano}
                        atual={celula.atual}
                        eventos={eventosDoDia(celula.dia, celula.mes, celula.ano)}
                        hoje={hoje}
                        onClicar={abrirNovoEvento}
                        onAbrirEvento={(ev) => { setEventoEditando(ev); setDiaSelecionado(null); setModalAberto(true); }}
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </DndContext>

        {/* Próximos compromissos */}
        <PainelProximos
          eventos={proximosEventos}
          onAbrirEvento={(ev) => { setEventoEditando(ev); setDiaSelecionado(null); setModalAberto(true); }}
        />
      </div>

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
        mesSelecionado={mesSelecionado}
        anoSelecionado={anoSelecionado}
      />
    </div>
  );
};

export default Calendario;
