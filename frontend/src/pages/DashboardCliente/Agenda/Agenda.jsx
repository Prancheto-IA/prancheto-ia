// =============================================================
// PRANCHETO.IA - AGENDA (CRUD REAL)
// Conectado ao backend: GET/POST/PUT/DELETE /api/agenda
// =============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase.js';
import { useAuthStore } from '../../../store/authStore.js';

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const TIPOS_EVENTO = {
  reuniao:  { label: 'Reunião',  cor: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  tarefa:   { label: 'Tarefa',   cor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  lembrete: { label: 'Lembrete', cor: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' },
  ligacao:  { label: 'Ligação',  cor: 'bg-violet-500/20 text-violet-300 border-violet-500/30' },
  outro:    { label: 'Outro',    cor: 'bg-slate-500/20 text-slate-300 border-slate-500/30' },
};

const getDiasDoMes = (ano, mes) => ({
  primeiroDia: new Date(ano, mes, 1).getDay(),
  totalDias:   new Date(ano, mes + 1, 0).getDate(),
});

const dataParaISO = (ano, mes, dia, hora = '00:00') => {
  const pad = n => String(n).padStart(2, '0');
  return `${ano}-${pad(mes + 1)}-${pad(dia)}T${hora}:00`;
};

const FORM_VAZIO = {
  titulo: '', descricao: '', hora: '09:00', hora_fim: '10:00',
  tipo: 'reuniao', local: '', cor: '#6366f1',
};

// ─── Modal de criação/edição ───────────────────────────────────
const ModalEvento = ({ aberto, onFechar, onSalvar, diaSelecionado, mesAtual, anoAtual, eventoEditando }) => {
  const [form, setForm] = useState(FORM_VAZIO);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (eventoEditando) {
      const inicio = new Date(eventoEditando.data_inicio);
      const fim    = eventoEditando.data_fim ? new Date(eventoEditando.data_fim) : null;
      setForm({
        titulo:    eventoEditando.titulo || '',
        descricao: eventoEditando.descricao || '',
        hora:      `${String(inicio.getHours()).padStart(2,'0')}:${String(inicio.getMinutes()).padStart(2,'0')}`,
        hora_fim:  fim ? `${String(fim.getHours()).padStart(2,'0')}:${String(fim.getMinutes()).padStart(2,'0')}` : '10:00',
        tipo:      eventoEditando.tipo || 'reuniao',
        local:     eventoEditando.local || '',
        cor:       eventoEditando.cor || '#6366f1',
      });
    } else {
      setForm(FORM_VAZIO);
    }
    setErro('');
  }, [eventoEditando, aberto]);

  if (!aberto) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.titulo.trim()) { setErro('Título é obrigatório.'); return; }
    setSalvando(true);
    setErro('');
    try {
      await onSalvar({
        titulo:      form.titulo.trim(),
        descricao:   form.descricao.trim() || null,
        data_inicio: dataParaISO(anoAtual, mesAtual, diaSelecionado, form.hora),
        data_fim:    dataParaISO(anoAtual, mesAtual, diaSelecionado, form.hora_fim),
        tipo:        form.tipo,
        local:       form.local.trim() || null,
        cor:         form.cor,
      });
      onFechar();
    } catch (err) {
      setErro(err?.response?.data?.mensagem || 'Erro ao salvar evento.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-surface-card border border-surface-border rounded-xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-semibold">{eventoEditando ? 'Editar Evento' : 'Novo Evento'}</h3>
          <button onClick={onFechar} className="text-slate-500 hover:text-white text-lg">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Título */}
          <div>
            <label className="block text-slate-300 text-xs font-medium mb-1">Título *</label>
            <input
              type="text"
              value={form.titulo}
              onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
              placeholder="Ex: Reunião com cliente"
              className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-primary-500/50"
            />
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-slate-300 text-xs font-medium mb-1">Tipo</label>
            <select
              value={form.tipo}
              onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
              className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500/50"
            >
              {Object.entries(TIPOS_EVENTO).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>

          {/* Horários */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 text-xs font-medium mb-1">Início</label>
              <input
                type="time"
                value={form.hora}
                onChange={e => setForm(f => ({ ...f, hora: e.target.value }))}
                className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500/50"
              />
            </div>
            <div>
              <label className="block text-slate-300 text-xs font-medium mb-1">Fim</label>
              <input
                type="time"
                value={form.hora_fim}
                onChange={e => setForm(f => ({ ...f, hora_fim: e.target.value }))}
                className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500/50"
              />
            </div>
          </div>

          {/* Local */}
          <div>
            <label className="block text-slate-300 text-xs font-medium mb-1">Local</label>
            <input
              type="text"
              value={form.local}
              onChange={e => setForm(f => ({ ...f, local: e.target.value }))}
              placeholder="Ex: Sala de reuniões / Google Meet"
              className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-primary-500/50"
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-slate-300 text-xs font-medium mb-1">Descrição</label>
            <textarea
              value={form.descricao}
              onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
              placeholder="Detalhes do evento..."
              rows={2}
              className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-primary-500/50 resize-none"
            />
          </div>

          {erro && <p className="text-red-400 text-xs">{erro}</p>}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onFechar}
              className="flex-1 bg-surface border border-surface-border text-slate-300 py-2 rounded-lg text-sm hover:bg-white/5 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="flex-1 bg-primary-600 hover:bg-primary-500 text-white py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Componente principal ──────────────────────────────────────
const Agenda = () => {
  const hoje = new Date();
  const [mesAtual, setMesAtual]           = useState(hoje.getMonth());
  const [anoAtual, setAnoAtual]           = useState(hoje.getFullYear());
  const [diaSelecionado, setDiaSelecionado] = useState(hoje.getDate());
  const [modalAberto, setModalAberto]     = useState(false);
  const [eventoEditando, setEventoEditando] = useState(null);
  const [eventos, setEventos]             = useState([]);
  const [carregando, setCarregando]       = useState(true);
  const [excluindo, setExcluindo]         = useState(null);
  const { usuario }                       = useAuthStore();

  const { primeiroDia, totalDias } = getDiasDoMes(anoAtual, mesAtual);

  const nomeMes = new Date(anoAtual, mesAtual).toLocaleDateString('pt-BR', {
    month: 'long', year: 'numeric',
  });

  // Carrega eventos do backend
  const carregarEventos = useCallback(async () => {
    if (!usuario?.id) return;
    setCarregando(true);
    try {
      const { data, error } = await supabase
        .from('agenda_eventos')
        .select('*')
        .order('data_inicio', { ascending: true });
        
      if (error) throw error;
      setEventos(data || []);
    } catch (err) {
      console.error('Erro ao carregar agenda:', err);
    } finally {
      setCarregando(false);
    }
  }, [usuario?.id]);

  useEffect(() => { carregarEventos(); }, [carregarEventos]);

  const irMesAnterior = () => {
    if (mesAtual === 0) { setMesAtual(11); setAnoAtual(a => a - 1); }
    else setMesAtual(m => m - 1);
  };

  const irProximoMes = () => {
    if (mesAtual === 11) { setMesAtual(0); setAnoAtual(a => a + 1); }
    else setMesAtual(m => m + 1);
  };

  const eventosDoDia = eventos.filter(e => {
    const d = new Date(e.data_inicio);
    return d.getDate() === diaSelecionado &&
           d.getMonth() === mesAtual &&
           d.getFullYear() === anoAtual;
  });

  const temEventoNoDia = (dia) => eventos.some(e => {
    const d = new Date(e.data_inicio);
    return d.getDate() === dia && d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
  });

  const handleSalvar = async (dadosEvento) => {
    try {
      if (eventoEditando) {
        const { error } = await supabase
          .from('agenda_eventos')
          .update(dadosEvento)
          .eq('id', eventoEditando.id);
        if (error) throw error;
      } else {
        const payload = {
          ...dadosEvento,
          criado_por: usuario.id,
          tenant_id: usuario.tenant_id
        };
        const { error } = await supabase
          .from('agenda_eventos')
          .insert(payload);
        if (error) throw error;
      }
      await carregarEventos();
    } catch (error) {
      throw error; // propagar para o modal exibir erro
    }
  };

  const handleExcluir = async (id) => {
    if (!window.confirm('Excluir este evento?')) return;
    setExcluindo(id);
    try {
      const { error } = await supabase.from('agenda_eventos').delete().eq('id', id);
      if (error) throw error;
      setEventos(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      console.error('Erro ao excluir:', err);
    } finally {
      setExcluindo(null);
    }
  };

  const abrirNovoEvento = () => {
    setEventoEditando(null);
    setModalAberto(true);
  };

  const abrirEdicao = (evento) => {
    setEventoEditando(evento);
    setModalAberto(true);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">

      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">🗓️ Agenda</h1>
          <p className="text-slate-400 text-sm mt-1">Organize seus compromissos e reuniões.</p>
        </div>
        <button
          onClick={abrirNovoEvento}
          className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          <span>+</span> Novo evento
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Calendário */}
        <div className="lg:col-span-2 bg-surface-card border border-surface-border rounded-xl p-5">

          {/* Navegação do mês */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={irMesAnterior} className="text-slate-400 hover:text-white transition-colors p-1 text-xl">‹</button>
            <h2 className="text-white font-semibold capitalize">{nomeMes}</h2>
            <button onClick={irProximoMes} className="text-slate-400 hover:text-white transition-colors p-1 text-xl">›</button>
          </div>

          {/* Dias da semana */}
          <div className="grid grid-cols-7 mb-2">
            {DIAS_SEMANA.map(d => (
              <div key={d} className="text-center text-xs text-slate-500 font-medium py-1">{d}</div>
            ))}
          </div>

          {/* Dias do mês */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: primeiroDia }).map((_, i) => (
              <div key={`vazio-${i}`} />
            ))}
            {Array.from({ length: totalDias }).map((_, i) => {
              const dia = i + 1;
              const ehHoje = dia === hoje.getDate() && mesAtual === hoje.getMonth() && anoAtual === hoje.getFullYear();
              const ehSelecionado = dia === diaSelecionado;
              const temEvento = temEventoNoDia(dia);

              return (
                <button
                  key={dia}
                  onClick={() => setDiaSelecionado(dia)}
                  className={`
                    relative aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-all
                    ${ehSelecionado
                      ? 'bg-primary-600 text-white font-bold'
                      : ehHoje
                        ? 'bg-primary-500/20 text-primary-300 font-semibold'
                        : 'text-slate-300 hover:bg-white/5'
                    }
                  `}
                >
                  {dia}
                  {temEvento && (
                    <span className={`absolute bottom-1 w-1 h-1 rounded-full ${ehSelecionado ? 'bg-white' : 'bg-primary-400'}`} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Eventos do dia selecionado */}
        <div className="bg-surface-card border border-surface-border rounded-xl p-5">
          <h3 className="text-white font-semibold mb-1">
            {diaSelecionado}/{mesAtual + 1}/{anoAtual}
          </h3>
          <p className="text-slate-400 text-xs mb-4">
            {carregando ? 'Carregando...' : eventosDoDia.length === 0 ? 'Nenhum evento neste dia.' : `${eventosDoDia.length} evento(s)`}
          </p>

          <div className="space-y-3">
            {eventosDoDia.map(evento => {
              const tipo = TIPOS_EVENTO[evento.tipo] || TIPOS_EVENTO.outro;
              const inicio = new Date(evento.data_inicio);
              const horaStr = `${String(inicio.getHours()).padStart(2,'0')}:${String(inicio.getMinutes()).padStart(2,'0')}`;

              return (
                <div key={evento.id} className="bg-surface border border-surface-border rounded-lg p-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 ${tipo.cor}`}>
                      {tipo.label}
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => abrirEdicao(evento)}
                        className="text-slate-500 hover:text-primary-400 text-xs transition-colors"
                        title="Editar"
                      >✏️</button>
                      <button
                        onClick={() => handleExcluir(evento.id)}
                        disabled={excluindo === evento.id}
                        className="text-slate-500 hover:text-red-400 text-xs transition-colors disabled:opacity-50"
                        title="Excluir"
                      >🗑️</button>
                    </div>
                  </div>
                  <p className="text-white text-sm font-medium mt-2">{evento.titulo}</p>
                  <p className="text-slate-400 text-xs mt-1">⏰ {horaStr}</p>
                  {evento.local && <p className="text-slate-500 text-xs mt-0.5">📍 {evento.local}</p>}
                </div>
              );
            })}

            {!carregando && eventosDoDia.length === 0 && (
              <div className="text-center py-8">
                <p className="text-4xl mb-2">📭</p>
                <p className="text-slate-500 text-sm">Dia livre!</p>
                <button
                  onClick={abrirNovoEvento}
                  className="mt-3 text-primary-400 hover:text-primary-300 text-xs transition-colors"
                >
                  + Adicionar evento
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      <ModalEvento
        aberto={modalAberto}
        onFechar={() => { setModalAberto(false); setEventoEditando(null); }}
        onSalvar={handleSalvar}
        diaSelecionado={diaSelecionado}
        mesAtual={mesAtual}
        anoAtual={anoAtual}
        eventoEditando={eventoEditando}
      />
    </div>
  );
};

export default Agenda;
