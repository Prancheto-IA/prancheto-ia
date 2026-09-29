// =============================================================
// PRANCHETO.IA - MODAL DE RÓTULOS DE STATUS (CRM e Outbound)
//
// Um único modal reutilizado nas duas telas (CRM/Leads e Outbound),
// parametrizado por `dominio`. Duas seções:
//   - "Meus rótulos": todo mundo edita, vale só pra quem está logado.
//   - "Padrão da empresa": só aparece pra quem tem permissão
//     (rotulos.gerenciar, dono do tenant, ou super_admin).
// Campo em branco = "não personalizei" — herda do nível de baixo
// (empresa, depois sistema). O rótulo efetivo (já resolvido pela
// precedência) aparece como texto de ajuda abaixo de cada campo.
// =============================================================

import React, { useState, useEffect } from 'react';
import { useRotulosStatus } from '../../hooks/useRotulosStatus.js';

const DESCRICAO_STATUS = {
  outbound: {
    pendente:    'Pendente (ainda não contatado)',
    enviado:     'Enviado (primeiro contato feito)',
    respondido:  'Respondido (a pessoa retornou)',
    sem_retorno: 'Sem retorno (não respondeu)',
    convertido:  'Convertido (fechou negócio)',
  },
  crm_funil: {
    lead:        'Lead (etapa inicial, ainda não contatado)',
    qualificado: 'Qualificado (primeiro contato feito)',
    proposta:    'Proposta enviada',
    negociacao:  'Em negociação',
    fechado:     'Fechado (negócio ganho)',
    perdido:     'Perdido (negócio não avançou)',
  },
};

const TITULO_DOMINIO = {
  outbound:  'Rótulos do Outbound',
  crm_funil: 'Rótulos do Funil',
};

const inputStyle = {
  backgroundColor: 'var(--color-surface)',
  border: '1px solid var(--color-surface-border)',
  color: 'var(--color-text-primary)',
};

const CampoRotulo = ({ descricao, valor, placeholder, onChange }) => (
  <div className="mb-3">
    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
      {descricao}
    </label>
    <input
      type="text"
      value={valor}
      placeholder={placeholder}
      maxLength={40}
      onChange={onChange}
      className="w-full rounded-lg px-3 py-2 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-colors"
      style={inputStyle}
    />
    <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
      Vazio usa o padrão atual: "{placeholder}"
    </p>
  </div>
);

const ModalRotulosStatus = ({ aberto, onFechar, dominio }) => {
  const {
    ordem, padraoSistema, meuRotulo, padraoEmpresa, carregando,
    podeDefinirPadraoEmpresa, salvarMeu, definirPadraoEmpresa,
  } = useRotulosStatus(dominio);

  const [formMeu, setFormMeu]         = useState({});
  const [formEmpresa, setFormEmpresa] = useState({});
  const [salvando, setSalvando]       = useState(false);
  const [erro, setErro]               = useState('');
  const [salvo, setSalvo]             = useState(false);

  useEffect(() => {
    if (!aberto) return;
    setFormMeu(meuRotulo);
    setFormEmpresa(padraoEmpresa);
    setErro('');
    setSalvo(false);
  }, [aberto, meuRotulo, padraoEmpresa]);

  if (!aberto) return null;

  const descricoes = DESCRICAO_STATUS[dominio];

  const handleSalvar = async () => {
    setSalvando(true);
    setErro('');
    try {
      await salvarMeu(formMeu);
      if (podeDefinirPadraoEmpresa) {
        await definirPadraoEmpresa(formEmpresa);
      }
      setSalvo(true);
      setTimeout(() => setSalvo(false), 2000);
    } catch (err) {
      setErro(err.message || 'Erro ao salvar rótulos.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onFechar}>
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl"
        style={{ backgroundColor: 'var(--color-surface-card)', border: '1px solid var(--color-surface-border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--color-surface-border)' }}>
          <h2 className="font-semibold text-base" style={{ color: 'var(--color-text-primary)' }}>
            ⚙️ {TITULO_DOMINIO[dominio]}
          </h2>
          <button onClick={onFechar} className="acao-sutil text-xl">✕</button>
        </div>

        <div className="p-5">
          {carregando ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <section className="mb-5">
                <h3 className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                  Meus rótulos
                </h3>
                <p className="text-xs mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                  Só você vê assim. O status técnico continua o mesmo para todos.
                </p>
                {ordem.map((status) => (
                  <CampoRotulo
                    key={status}
                    descricao={descricoes[status]}
                    valor={formMeu[status] ?? ''}
                    placeholder={padraoEmpresa[status] || padraoSistema[status]}
                    onChange={(e) => setFormMeu((f) => ({ ...f, [status]: e.target.value }))}
                  />
                ))}
                <button
                  type="button"
                  onClick={() => setFormMeu({})}
                  className="text-primary-400 hover:text-primary-300 text-xs transition-colors"
                >
                  Restaurar meu padrão
                </button>
              </section>

              {podeDefinirPadraoEmpresa && (
                <section className="pt-4" style={{ borderTop: '1px solid var(--color-surface-border)' }}>
                  <h3 className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                    Padrão da empresa
                  </h3>
                  <p className="text-xs mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                    Vale para todo mundo na empresa que não tiver um rótulo pessoal definido.
                  </p>
                  {ordem.map((status) => (
                    <CampoRotulo
                      key={status}
                      descricao={descricoes[status]}
                      valor={formEmpresa[status] ?? ''}
                      placeholder={padraoSistema[status]}
                      onChange={(e) => setFormEmpresa((f) => ({ ...f, [status]: e.target.value }))}
                    />
                  ))}
                  <button
                    type="button"
                    onClick={() => setFormEmpresa({})}
                    className="text-primary-400 hover:text-primary-300 text-xs transition-colors"
                  >
                    Restaurar padrão da empresa
                  </button>
                </section>
              )}

              {erro && <p className="text-red-400 text-xs mt-3">{erro}</p>}

              <div className="flex gap-3 pt-5 mt-2" style={{ borderTop: '1px solid var(--color-surface-border)' }}>
                <button
                  type="button"
                  onClick={onFechar}
                  className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
                  style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-surface-border)' }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSalvar}
                  disabled={salvando}
                  className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium bg-primary-600 hover:bg-primary-500 text-white transition-colors disabled:opacity-50"
                >
                  {salvando ? 'Salvando...' : salvo ? '✓ Salvo!' : 'Salvar'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModalRotulosStatus;
