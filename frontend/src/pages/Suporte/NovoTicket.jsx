// =============================================================
// PRANCHETO.IA - SUPORTE / Novo Ticket
// Formulário de abertura de chamado de suporte.
// =============================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSuporte, CATEGORIA_TICKET, PRIORIDADE_TICKET } from '../../hooks/useSuporte.js';
import { useUIStore } from '../../store/uiStore.js';

const FORM_VAZIO = {
  assunto: '',
  categoria: 'duvida',
  prioridade: 'media',
  descricao: '',
};

const inputBase =
  'w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-primary-500/50';

const NovoTicket = () => {
  const navigate = useNavigate();
  const { criarTicket } = useSuporte();
  const { adicionarNotificacao } = useUIStore();

  const [form, setForm] = useState(FORM_VAZIO);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.assunto.trim()) {
      setErro('Informe o assunto do ticket.');
      return;
    }
    setSalvando(true);
    setErro('');
    try {
      await criarTicket({
        assunto: form.assunto.trim(),
        categoria: form.categoria,
        prioridade: form.prioridade,
        descricao: form.descricao.trim() || null,
      });
      adicionarNotificacao('success', 'Ticket aberto com sucesso!');
      navigate('/suporte/meus');
    } catch (err) {
      console.error('NovoTicket.handleSubmit:', err);
      setErro('Não foi possível abrir o ticket. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white">Abrir novo ticket</h2>
        <p className="text-slate-400 text-sm mt-1">
          Descreva sua solicitação e nossa equipe entrará em contato.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-surface-card border border-surface-border rounded-xl p-6 space-y-4"
      >
        <div>
          <label className="block text-slate-300 text-xs font-medium mb-1">Assunto *</label>
          <input
            type="text"
            value={form.assunto}
            onChange={set('assunto')}
            placeholder="Resumo da sua solicitação"
            className={inputBase}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-300 text-xs font-medium mb-1">Categoria</label>
            <select value={form.categoria} onChange={set('categoria')} className={inputBase}>
              {Object.entries(CATEGORIA_TICKET).map(([k, v]) => (
                <option key={k} value={k}>{v.emoji} {v.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-slate-300 text-xs font-medium mb-1">Prioridade</label>
            <select value={form.prioridade} onChange={set('prioridade')} className={inputBase}>
              {Object.entries(PRIORIDADE_TICKET).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-slate-300 text-xs font-medium mb-1">Descrição</label>
          <textarea
            value={form.descricao}
            onChange={set('descricao')}
            placeholder="Detalhe o que está acontecendo, passos para reproduzir, prints, etc."
            rows={5}
            className={`${inputBase} resize-none`}
          />
        </div>

        {erro && <p className="text-red-400 text-xs">{erro}</p>}

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={() => navigate('/suporte/meus')}
            className="flex-1 bg-surface border border-surface-border text-slate-300 py-2 rounded-lg text-sm hover:bg-white/5 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={salvando}
            className="flex-1 bg-primary-600 hover:bg-primary-500 text-white py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {salvando ? 'Enviando...' : 'Abrir ticket'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NovoTicket;
