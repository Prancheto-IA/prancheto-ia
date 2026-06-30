// =============================================================
// PRANCHETO.IA - AGENDA
// Página funcional básica de agenda com calendário mensal.
// =============================================================

import React, { useState } from 'react';

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const TIPOS_EVENTO = {
  reuniao:     { label: 'Reunião',    cor: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  tarefa:      { label: 'Tarefa',     cor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  lembrete:    { label: 'Lembrete',   cor: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' },
  ligacao:     { label: 'Ligação',    cor: 'bg-violet-500/20 text-violet-300 border-violet-500/30' },
  outro:       { label: 'Outro',      cor: 'bg-slate-500/20 text-slate-300 border-slate-500/30' },
};

// Eventos de exemplo para demonstração
const EVENTOS_DEMO = [
  { id: 1, titulo: 'Reunião de alinhamento', tipo: 'reuniao',  data: new Date(), hora: '10:00' },
  { id: 2, titulo: 'Ligar para cliente',     tipo: 'ligacao',  data: new Date(), hora: '14:30' },
  { id: 3, titulo: 'Enviar proposta',        tipo: 'tarefa',   data: new Date(Date.now() + 86400000), hora: '09:00' },
];

const getDiasDoMes = (ano, mes) => {
  const primeiroDia = new Date(ano, mes, 1).getDay();
  const totalDias   = new Date(ano, mes + 1, 0).getDate();
  return { primeiroDia, totalDias };
};

const Agenda = () => {
  const hoje = new Date();
  const [mesAtual, setMesAtual] = useState(hoje.getMonth());
  const [anoAtual, setAnoAtual] = useState(hoje.getFullYear());
  const [diaSelecionado, setDiaSelecionado] = useState(hoje.getDate());
  const [modalAberto, setModalAberto] = useState(false);

  const { primeiroDia, totalDias } = getDiasDoMes(anoAtual, mesAtual);

  const nomeMes = new Date(anoAtual, mesAtual).toLocaleDateString('pt-BR', {
    month: 'long', year: 'numeric',
  });

  const irMesAnterior = () => {
    if (mesAtual === 0) { setMesAtual(11); setAnoAtual(a => a - 1); }
    else setMesAtual(m => m - 1);
  };

  const irProximoMes = () => {
    if (mesAtual === 11) { setMesAtual(0); setAnoAtual(a => a + 1); }
    else setMesAtual(m => m + 1);
  };

  const eventosDoDia = EVENTOS_DEMO.filter(e => {
    const d = new Date(e.data);
    return d.getDate() === diaSelecionado &&
           d.getMonth() === mesAtual &&
           d.getFullYear() === anoAtual;
  });

  const temEventoNoDia = (dia) => EVENTOS_DEMO.some(e => {
    const d = new Date(e.data);
    return d.getDate() === dia && d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
  });

  return (
    <div className="p-6 max-w-5xl mx-auto">

      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">🗓️ Agenda</h1>
          <p className="text-slate-400 text-sm mt-1">Organize seus compromissos e reuniões.</p>
        </div>
        <button
          onClick={() => setModalAberto(true)}
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
            <button onClick={irMesAnterior} className="text-slate-400 hover:text-white transition-colors p-1">‹</button>
            <h2 className="text-white font-semibold capitalize">{nomeMes}</h2>
            <button onClick={irProximoMes} className="text-slate-400 hover:text-white transition-colors p-1">›</button>
          </div>

          {/* Dias da semana */}
          <div className="grid grid-cols-7 mb-2">
            {DIAS_SEMANA.map(d => (
              <div key={d} className="text-center text-xs text-slate-500 font-medium py-1">{d}</div>
            ))}
          </div>

          {/* Dias do mês */}
          <div className="grid grid-cols-7 gap-1">
            {/* Células vazias antes do primeiro dia */}
            {Array.from({ length: primeiroDia }).map((_, i) => (
              <div key={`vazio-${i}`} />
            ))}

            {/* Dias */}
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
            {eventosDoDia.length === 0 ? 'Nenhum evento neste dia.' : `${eventosDoDia.length} evento(s)`}
          </p>

          <div className="space-y-3">
            {eventosDoDia.map(evento => {
              const tipo = TIPOS_EVENTO[evento.tipo] || TIPOS_EVENTO.outro;
              return (
                <div key={evento.id} className="bg-surface border border-surface-border rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 mt-0.5 ${tipo.cor}`}>
                      {tipo.label}
                    </span>
                  </div>
                  <p className="text-white text-sm font-medium mt-2">{evento.titulo}</p>
                  <p className="text-slate-400 text-xs mt-1">⏰ {evento.hora}</p>
                </div>
              );
            })}

            {eventosDoDia.length === 0 && (
              <div className="text-center py-8">
                <p className="text-4xl mb-2">📭</p>
                <p className="text-slate-500 text-sm">Dia livre!</p>
                <button
                  onClick={() => setModalAberto(true)}
                  className="mt-3 text-primary-400 hover:text-primary-300 text-xs transition-colors"
                >
                  + Adicionar evento
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Novo Evento (Em Construção) */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-surface-card border border-surface-border rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Novo Evento</h3>
              <button onClick={() => setModalAberto(false)} className="text-slate-500 hover:text-white">✕</button>
            </div>
            <div className="text-center py-8">
              <p className="text-4xl mb-3">🚧</p>
              <p className="text-white font-medium mb-1">Em Construção</p>
              <p className="text-slate-400 text-sm">
                O formulário de criação de eventos estará disponível em breve.
              </p>
            </div>
            <button
              onClick={() => setModalAberto(false)}
              className="w-full bg-surface border border-surface-border text-slate-300 py-2 rounded-lg text-sm hover:bg-white/5 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Agenda;
