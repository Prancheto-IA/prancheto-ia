// =============================================================
// PRANCHETO.IA - MODAL DE CADASTRO E EDIÇÃO DE EMPRESA (B2B)
// Emitly Design System & ReUI Components
// =============================================================

import React, { useState, useEffect } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Building02Icon,
  Search01Icon,
  Location01Icon,
  Globe02Icon,
  Call02Icon,
  WhatsappIcon,
  Mail01Icon,
  Cancel01Icon,
  AiSparklesIcon,
  Image01Icon,
  FloppyDiskIcon,
} from '@hugeicons/core-free-icons';

import { Badge } from '@/components/reui/badge';
import { SimpleTooltip } from '@/components/reui/tooltip';
import { SelectField } from '@/components/ui/select';
import { Avatar } from '@/components/ui/avatar';
import {
  STATUS_EMPRESA_OPCOES,
  PORTE_EMPRESA_OPCOES,
  formatarCNPJ,
} from '../../hooks/useCRM.js';

const FORM_INICIAL = {
  nome_fantasia: '',
  razao_social: '',
  cnpj: '',
  logotipo_url: '',
  segmento: '',
  porte: 'pequena',
  site: '',
  email_geral: '',
  telefone_geral: '',
  whatsapp_geral: '',
  status: 'prospect',
  observacoes: '',
  endereco: {
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
  },
};

export const ModalEmpresa = ({ aberta, empresaParaEditar, onFechar, onSalvar }) => {
  const [form, setForm] = useState(FORM_INICIAL);
  const [consultandoCnpj, setConsultandoCnpj] = useState(false);
  const [consultandoCep, setConsultandoCep] = useState(false);
  const [mensagemCnpj, setMensagemCnpj] = useState(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (empresaParaEditar) {
      setForm({
        ...FORM_INICIAL,
        ...empresaParaEditar,
        endereco: {
          ...FORM_INICIAL.endereco,
          ...(empresaParaEditar.endereco || {}),
        },
      });
    } else {
      setForm(FORM_INICIAL);
    }
    setMensagemCnpj(null);
  }, [empresaParaEditar, aberta]);

  if (!aberta) return null;

  const handleChange = (campo) => (e) => {
    const valor = e?.target ? e.target.value : e;
    setForm(prev => ({ ...prev, [campo]: valor }));
  };

  const handleEnderecoChange = (campo) => (e) => {
    const valor = e.target.value;
    setForm(prev => ({
      ...prev,
      endereco: { ...prev.endereco, [campo]: valor },
    }));
  };

  // ─── Consulta inteligente de CNPJ via BrasilAPI ─────────────────
  const consultarCNPJ = async () => {
    const cnpjLimpo = (form.cnpj || '').replace(/\D/g, '');
    if (cnpjLimpo.length !== 14) {
      setMensagemCnpj({ tipo: 'erro', texto: 'Informe um CNPJ válido com 14 dígitos.' });
      return;
    }

    setConsultandoCnpj(true);
    setMensagemCnpj(null);
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`);
      if (!res.ok) throw new Error('CNPJ não encontrado na base pública.');
      const data = await res.json();

      // Mapeamento automático de porte
      let porteMapeado = 'pequena';
      const porteDesc = (data.porte || '').toLowerCase();
      if (porteDesc.includes('mei')) porteMapeado = 'mei';
      else if (porteDesc.includes('micro') || porteDesc.includes('me')) porteMapeado = 'micro';
      else if (porteDesc.includes('pequeno') || porteDesc.includes('epp')) porteMapeado = 'pequena';
      else if (porteDesc.includes('medio') || porteDesc.includes('media')) porteMapeado = 'media';
      else if (porteDesc.includes('grande')) porteMapeado = 'grande';

      setForm(prev => ({
        ...prev,
        razao_social: data.razao_social || prev.razao_social,
        nome_fantasia: data.nome_fantasia || data.razao_social || prev.nome_fantasia,
        segmento: data.cnae_fiscal_descricao || prev.segmento,
        porte: porteMapeado,
        telefone_geral: data.ddd_telefone_1 ? `(${data.ddd_telefone_1.slice(0, 2)}) ${data.ddd_telefone_1.slice(2)}` : prev.telefone_geral,
        email_geral: data.email ? data.email.toLowerCase() : prev.email_geral,
        endereco: {
          ...prev.endereco,
          cep: data.cep || prev.endereco.cep,
          logradouro: data.logradouro || prev.endereco.logradouro,
          numero: data.numero || prev.endereco.numero,
          complemento: data.complemento || prev.endereco.complemento,
          bairro: data.bairro || prev.endereco.bairro,
          cidade: data.municipio || prev.endereco.cidade,
          estado: data.uf || prev.endereco.estado,
        },
      }));
      setMensagemCnpj({ tipo: 'sucesso', texto: 'Dados e endereço preenchidos automaticamente via Receita Federal!' });
    } catch (err) {
      setMensagemCnpj({ tipo: 'erro', texto: err.message || 'Não foi possível buscar os dados do CNPJ.' });
    } finally {
      setConsultandoCnpj(false);
    }
  };

  // ─── Consulta rápida de CEP via ViaCEP ─────────────────────────
  const consultarCEP = async () => {
    const cepLimpo = (form.endereco.cep || '').replace(/\D/g, '');
    if (cepLimpo.length !== 8) return;

    setConsultandoCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setForm(prev => ({
          ...prev,
          endereco: {
            ...prev.endereco,
            logradouro: data.logradouro || prev.endereco.logradouro,
            bairro: data.bairro || prev.endereco.bairro,
            cidade: data.localidade || prev.endereco.cidade,
            estado: data.uf || prev.endereco.estado,
          },
        }));
      }
    } catch { /* falha silenciosa */ }
    finally { setConsultandoCep(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nome_fantasia?.trim()) {
      alert('Informe ao menos o Nome Fantasia da empresa.');
      return;
    }

    setSalvando(true);
    try {
      await onSalvar(form);
      onFechar();
    } catch (err) {
      alert('Erro ao salvar empresa: ' + err.message);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={onFechar}
    >
      <div
        className="bg-surface-card rounded-2xl w-full max-w-3xl border border-surface-border shadow-2xl overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Topo do Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border bg-surface-subtle">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-secondary/15 flex items-center justify-center text-brand-secondary border border-brand-secondary/30">
              <HugeiconsIcon icon={Building02Icon} size={22} />
            </div>
            <div>
              <h2 className="font-bold text-lg text-ink-primary">
                {empresaParaEditar ? 'Editar Empresa' : 'Cadastrar Nova Empresa'}
              </h2>
              <p className="text-xs text-ink-secondary">
                Centralize os dados cadastrais, endereço e identificação corporativa
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onFechar}
            className="p-1.5 rounded-lg text-ink-secondary hover:text-ink-primary hover:bg-surface-hover transition-colors"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={20} />
          </button>
        </div>

        {/* Formulário com Scroll Suave */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Alerta de busca de CNPJ */}
          {mensagemCnpj && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                mensagemCnpj.tipo === 'sucesso'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                  : 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'
              }`}
            >
              <HugeiconsIcon icon={AiSparklesIcon} size={16} className="shrink-0" />
              <span>{mensagemCnpj.texto}</span>
            </div>
          )}

          {/* Seção 1: Identificação Corporativa & CNPJ */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-secondary">
                1. Identificação Corporativa
              </span>
              <span className="text-xs text-ink-secondary">
                Preenchimento automático por CNPJ disponível
              </span>
            </div>

            {/* CNPJ com botão de busca automática */}
            <div>
              <label className="block text-xs font-semibold text-ink-secondary mb-1">
                CNPJ (Pessoa Jurídica)
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={form.cnpj}
                    onChange={(e) => setForm(prev => ({ ...prev, cnpj: formatarCNPJ(e.target.value) }))}
                    placeholder="00.000.000/0000-00"
                    maxLength={18}
                    className="w-full rounded-xl px-3.5 py-2.5 text-sm bg-surface-subtle border border-surface-border text-ink-primary focus:outline-none focus:ring-2 focus:ring-brand-secondary/40 transition-all font-mono"
                  />
                </div>
                <button
                  type="button"
                  onClick={consultarCNPJ}
                  disabled={consultandoCnpj}
                  className="px-4 py-2.5 rounded-xl bg-brand-secondary/15 hover:bg-brand-secondary/25 border border-brand-secondary/35 text-brand-secondary text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50 shrink-0 cursor-pointer"
                >
                  <HugeiconsIcon icon={AiSparklesIcon} size={16} />
                  {consultandoCnpj ? 'Consultando...' : 'Buscar CNPJ'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-ink-secondary mb-1">
                  Nome Fantasia / Marca <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.nome_fantasia}
                  onChange={handleChange('nome_fantasia')}
                  placeholder="Ex: Acme Soluções"
                  className="w-full rounded-xl px-3.5 py-2.5 text-sm bg-surface-subtle border border-surface-border text-ink-primary focus:outline-none focus:ring-2 focus:ring-brand-secondary/40 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-secondary mb-1">
                  Razão Social Completa
                </label>
                <input
                  type="text"
                  value={form.razao_social}
                  onChange={handleChange('razao_social')}
                  placeholder="Ex: Acme Serviços e Tecnologias LTDA"
                  className="w-full rounded-xl px-3.5 py-2.5 text-sm bg-surface-subtle border border-surface-border text-ink-primary focus:outline-none focus:ring-2 focus:ring-brand-secondary/40 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-ink-secondary mb-1">
                  Segmento de Mercado
                </label>
                <input
                  type="text"
                  value={form.segmento}
                  onChange={handleChange('segmento')}
                  placeholder="Ex: Tecnologia, Varejo, Saúde..."
                  className="w-full rounded-xl px-3.5 py-2.5 text-sm bg-surface-subtle border border-surface-border text-ink-primary focus:outline-none focus:ring-2 focus:ring-brand-secondary/40 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-secondary mb-1">
                  Porte da Empresa
                </label>
                <SelectField
                  value={form.porte}
                  onChange={handleChange('porte')}
                >
                  {PORTE_EMPRESA_OPCOES.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </SelectField>
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-secondary mb-1">
                  Status no CRM
                </label>
                <SelectField
                  value={form.status}
                  onChange={handleChange('status')}
                >
                  {STATUS_EMPRESA_OPCOES.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </SelectField>
              </div>
            </div>

            {/* Logotipo da Empresa */}
            <div>
              <label className="block text-xs font-semibold text-ink-secondary mb-1">
                Logotipo da Empresa (URL de Imagem)
              </label>
              <div className="flex items-center gap-3">
                <Avatar
                  src={form.logotipo_url}
                  alt={form.nome_fantasia || 'Empresa'}
                  fallback={form.nome_fantasia || 'Empresa'}
                  className="w-12 h-12 rounded-xl border border-surface-border shrink-0 bg-surface-subtle font-bold text-sm"
                />
                <div className="relative flex-1">
                  <span className="absolute left-3 top-3 text-ink-secondary">
                    <HugeiconsIcon icon={Image01Icon} size={16} />
                  </span>
                  <input
                    type="url"
                    value={form.logotipo_url}
                    onChange={handleChange('logotipo_url')}
                    placeholder="https://exemplo.com/logo.png"
                    className="w-full rounded-xl pl-9 pr-3.5 py-2.5 text-sm bg-surface-subtle border border-surface-border text-ink-primary focus:outline-none focus:ring-2 focus:ring-brand-secondary/40 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Seção 2: Contatos Gerais & Canais */}
          <div className="space-y-4 pt-4 border-t border-surface-border">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-secondary block">
              2. Canais Principais de Comunicação
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-ink-secondary mb-1">
                  Website Corporativo
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-ink-secondary">
                    <HugeiconsIcon icon={Globe02Icon} size={16} />
                  </span>
                  <input
                    type="text"
                    value={form.site}
                    onChange={handleChange('site')}
                    placeholder="https://empresa.com.br"
                    className="w-full rounded-xl pl-9 pr-3.5 py-2.5 text-sm bg-surface-subtle border border-surface-border text-ink-primary focus:outline-none focus:ring-2 focus:ring-brand-secondary/40 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-secondary mb-1">
                  E-mail Corporativo Geral
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-ink-secondary">
                    <HugeiconsIcon icon={Mail01Icon} size={16} />
                  </span>
                  <input
                    type="email"
                    value={form.email_geral}
                    onChange={handleChange('email_geral')}
                    placeholder="contato@empresa.com.br"
                    className="w-full rounded-xl pl-9 pr-3.5 py-2.5 text-sm bg-surface-subtle border border-surface-border text-ink-primary focus:outline-none focus:ring-2 focus:ring-brand-secondary/40 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-secondary mb-1">
                  Telefone Geral / PABX
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-ink-secondary">
                    <HugeiconsIcon icon={Call02Icon} size={16} />
                  </span>
                  <input
                    type="text"
                    value={form.telefone_geral}
                    onChange={handleChange('telefone_geral')}
                    placeholder="(11) 3000-0000"
                    className="w-full rounded-xl pl-9 pr-3.5 py-2.5 text-sm bg-surface-subtle border border-surface-border text-ink-primary focus:outline-none focus:ring-2 focus:ring-brand-secondary/40 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-secondary mb-1">
                  WhatsApp Institucional
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-emerald-500">
                    <HugeiconsIcon icon={WhatsappIcon} size={16} />
                  </span>
                  <input
                    type="text"
                    value={form.whatsapp_geral}
                    onChange={handleChange('whatsapp_geral')}
                    placeholder="(11) 99999-9999"
                    className="w-full rounded-xl pl-9 pr-3.5 py-2.5 text-sm bg-surface-subtle border border-surface-border text-ink-primary focus:outline-none focus:ring-2 focus:ring-brand-secondary/40 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Seção 3: Endereço & Localização */}
          <div className="space-y-4 pt-4 border-t border-surface-border">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-secondary flex items-center gap-1.5">
                <HugeiconsIcon icon={Location01Icon} size={15} />
                3. Endereço & Localização
              </span>
              <span className="text-xs text-ink-secondary">
                Auto-preenchimento ao digitar o CEP
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-ink-secondary mb-1">
                  CEP
                </label>
                <input
                  type="text"
                  value={form.endereco.cep}
                  onChange={handleEnderecoChange('cep')}
                  onBlur={consultarCEP}
                  placeholder="00000-000"
                  maxLength={9}
                  className="w-full rounded-xl px-3.5 py-2.5 text-sm bg-surface-subtle border border-surface-border text-ink-primary focus:outline-none focus:ring-2 focus:ring-brand-secondary/40 transition-all font-mono"
                />
                {consultandoCep && <span className="text-[10px] text-brand-secondary">Buscando endereço...</span>}
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-ink-secondary mb-1">
                  Logradouro / Avenida / Rua
                </label>
                <input
                  type="text"
                  value={form.endereco.logradouro}
                  onChange={handleEnderecoChange('logradouro')}
                  placeholder="Av. Paulista"
                  className="w-full rounded-xl px-3.5 py-2.5 text-sm bg-surface-subtle border border-surface-border text-ink-primary focus:outline-none focus:ring-2 focus:ring-brand-secondary/40 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-ink-secondary mb-1">
                  Número
                </label>
                <input
                  type="text"
                  value={form.endereco.numero}
                  onChange={handleEnderecoChange('numero')}
                  placeholder="1000"
                  className="w-full rounded-xl px-3.5 py-2.5 text-sm bg-surface-subtle border border-surface-border text-ink-primary focus:outline-none focus:ring-2 focus:ring-brand-secondary/40 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-secondary mb-1">
                  Complemento / Sala
                </label>
                <input
                  type="text"
                  value={form.endereco.complemento}
                  onChange={handleEnderecoChange('complemento')}
                  placeholder="Sala 142"
                  className="w-full rounded-xl px-3.5 py-2.5 text-sm bg-surface-subtle border border-surface-border text-ink-primary focus:outline-none focus:ring-2 focus:ring-brand-secondary/40 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-secondary mb-1">
                  Bairro
                </label>
                <input
                  type="text"
                  value={form.endereco.bairro}
                  onChange={handleEnderecoChange('bairro')}
                  placeholder="Bela Vista"
                  className="w-full rounded-xl px-3.5 py-2.5 text-sm bg-surface-subtle border border-surface-border text-ink-primary focus:outline-none focus:ring-2 focus:ring-brand-secondary/40 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-secondary mb-1">
                  Cidade / UF
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.endereco.cidade}
                    onChange={handleEnderecoChange('cidade')}
                    placeholder="São Paulo"
                    className="w-full rounded-xl px-3 py-2.5 text-sm bg-surface-subtle border border-surface-border text-ink-primary focus:outline-none focus:ring-2 focus:ring-brand-secondary/40 transition-all"
                  />
                  <input
                    type="text"
                    value={form.endereco.estado}
                    onChange={handleEnderecoChange('estado')}
                    placeholder="SP"
                    maxLength={2}
                    className="w-14 rounded-xl px-2 py-2.5 text-sm bg-surface-subtle border border-surface-border text-ink-primary focus:outline-none focus:ring-2 focus:ring-brand-secondary/40 transition-all uppercase text-center font-bold"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Seção 4: Observações Gerais */}
          <div className="space-y-2 pt-4 border-t border-surface-border">
            <label className="block text-xs font-semibold text-ink-secondary">
              Anotações & Contexto Estratégico da Conta
            </label>
            <textarea
              rows={3}
              value={form.observacoes}
              onChange={handleChange('observacoes')}
              placeholder="Ex: Conta prioritária com intenção de contratação no próximo trimestre..."
              className="w-full rounded-xl p-3.5 text-sm bg-surface-subtle border border-surface-border text-ink-primary focus:outline-none focus:ring-2 focus:ring-brand-secondary/40 transition-all resize-none"
            />
          </div>

          {/* Rodapé do Modal */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-border">
            <button
              type="button"
              onClick={onFechar}
              disabled={salvando}
              className="px-5 py-2.5 rounded-xl border border-surface-border text-ink-secondary hover:text-ink-primary hover:bg-surface-hover text-sm font-semibold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="px-6 py-2.5 rounded-xl bg-brand-secondary hover:bg-brand-secondary/90 text-white text-sm font-bold flex items-center gap-2 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              <HugeiconsIcon icon={FloppyDiskIcon} size={18} />
              {salvando ? 'Salvando...' : empresaParaEditar ? 'Atualizar Empresa' : 'Cadastrar Empresa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalEmpresa;

