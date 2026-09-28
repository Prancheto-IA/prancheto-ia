// =============================================================
// PRANCHETO.IA - CAMPOS EXTRAS DE NEGÓCIO/CONTATO/EMPRESA
// Compartilhado entre os modais de Lead (CRM/Leads.jsx) e Cliente
// (CRM/Clientes.jsx) para não duplicar os mesmos campos de
// crm_contatos nos dois formulários.
// =============================================================

import React from 'react';

export const ENDERECO_VAZIO = {
  cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '',
};

export const PORTE_OPCOES = [
  { value: '',        label: 'Não informado' },
  { value: 'mei',     label: 'MEI' },
  { value: 'micro',   label: 'Microempresa' },
  { value: 'pequena', label: 'Pequena' },
  { value: 'media',   label: 'Média' },
  { value: 'grande',  label: 'Grande' },
];

const Rotulo = ({ children }) => (
  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
    {children}
  </label>
);

// ─── Nome do negócio, previsão de fechamento e campanha ─────────
// Só faz sentido enquanto Lead: uma vez Cliente, isso vira histórico do
// funil (mesmo tratamento já dado a origem/valor_estimado/status_funil).
export const CamposNegocio = ({ form, set, inputStyle }) => (
  <>
    <div className="grid grid-cols-2 gap-3">
      <div>
        <Rotulo>Nome do negócio</Rotulo>
        <input type="text" value={form.negocio_nome} onChange={set('negocio_nome')} placeholder="Expansão plano Enterprise"
          className="w-full rounded-lg px-3 py-2 text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          style={inputStyle} />
      </div>
      <div>
        <Rotulo>Campanha</Rotulo>
        <input type="text" value={form.campanha} onChange={set('campanha')} placeholder="Black Friday 2026"
          className="w-full rounded-lg px-3 py-2 text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          style={inputStyle} />
      </div>
    </div>
    <div>
      <Rotulo>Previsão de fechamento</Rotulo>
      <input type="date" value={form.previsao_fechamento} onChange={set('previsao_fechamento')}
        className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
        style={inputStyle} />
    </div>
  </>
);

// ─── WhatsApp — sempre editável, contato pode ganhar WhatsApp depois ────
export const CampoWhatsapp = ({ form, set, inputStyle }) => (
  <div>
    <Rotulo>WhatsApp</Rotulo>
    <input type="text" value={form.whatsapp} onChange={set('whatsapp')} placeholder="(11) 99999-9999"
      className="w-full rounded-lg px-3 py-2 text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
      style={inputStyle} />
  </div>
);

// ─── Seção recolhível: agrupa campos secundários atrás de um toggle ────
// Evita que o formulário de Lead/Cliente fique maior que a tela — só
// expande automaticamente quando o registro já tem dado nesses campos
// (ver temDadosNegocio/temDadosEmpresa), controlado pelo componente pai.
export const SecaoRecolhivel = ({ titulo, descricao, aberta, onToggle, children }) => (
  <div>
    <button type="button" onClick={onToggle} className="w-full flex items-center justify-between gap-2 text-left group">
      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
        {titulo}
      </span>
      <span className="text-xs font-medium text-primary-400 group-hover:text-primary-300 flex items-center gap-1 flex-shrink-0">
        {aberta ? 'Ocultar' : 'Mostrar'}
        <span className="text-[10px]">{aberta ? '▲' : '▼'}</span>
      </span>
    </button>
    {!aberta && descricao && (
      <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>{descricao}</p>
    )}
    {aberta && <div className="space-y-3 mt-3">{children}</div>}
  </div>
);

// ─── Empresa: razão social, documento, segmento, porte, site, endereço ──
export const CamposEmpresa = ({ form, set, setEndereco, inputStyle }) => (
  <>
    <div className="grid grid-cols-2 gap-3">
      <div>
        <Rotulo>Razão social</Rotulo>
        <input type="text" value={form.razao_social} onChange={set('razao_social')} placeholder="Acme Comércio LTDA"
          className="w-full rounded-lg px-3 py-2 text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          style={inputStyle} />
      </div>
      <div>
        <Rotulo>CNPJ/CPF</Rotulo>
        <input type="text" value={form.documento} onChange={set('documento')} placeholder="00.000.000/0000-00"
          className="w-full rounded-lg px-3 py-2 text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          style={inputStyle} />
      </div>
    </div>

    <div className="grid grid-cols-2 gap-3">
      <div>
        <Rotulo>Segmento</Rotulo>
        <input type="text" value={form.segmento} onChange={set('segmento')} placeholder="E-commerce, Saúde, Educação..."
          className="w-full rounded-lg px-3 py-2 text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          style={inputStyle} />
      </div>
      <div>
        <Rotulo>Porte</Rotulo>
        <select value={form.porte} onChange={set('porte')}
          className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
          style={inputStyle}>
          {PORTE_OPCOES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
    </div>

    <div>
      <Rotulo>Site</Rotulo>
      <input type="text" value={form.site} onChange={set('site')} placeholder="https://empresa.com"
        className="w-full rounded-lg px-3 py-2 text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        style={inputStyle} />
    </div>

    <div className="grid grid-cols-2 gap-3">
      <div>
        <Rotulo>CEP</Rotulo>
        <input type="text" value={form.endereco.cep} onChange={setEndereco('cep')} placeholder="00000-000"
          className="w-full rounded-lg px-3 py-2 text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          style={inputStyle} />
      </div>
      <div>
        <Rotulo>Cidade</Rotulo>
        <input type="text" value={form.endereco.cidade} onChange={setEndereco('cidade')} placeholder="São Paulo"
          className="w-full rounded-lg px-3 py-2 text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          style={inputStyle} />
      </div>
    </div>

    <div className="grid grid-cols-[2fr_1fr] gap-3">
      <div>
        <Rotulo>Logradouro</Rotulo>
        <input type="text" value={form.endereco.logradouro} onChange={setEndereco('logradouro')} placeholder="Av. Paulista"
          className="w-full rounded-lg px-3 py-2 text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          style={inputStyle} />
      </div>
      <div>
        <Rotulo>Número</Rotulo>
        <input type="text" value={form.endereco.numero} onChange={setEndereco('numero')} placeholder="1000"
          className="w-full rounded-lg px-3 py-2 text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          style={inputStyle} />
      </div>
    </div>

    <div className="grid grid-cols-[2fr_1fr] gap-3">
      <div>
        <Rotulo>Bairro</Rotulo>
        <input type="text" value={form.endereco.bairro} onChange={setEndereco('bairro')} placeholder="Bela Vista"
          className="w-full rounded-lg px-3 py-2 text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          style={inputStyle} />
      </div>
      <div>
        <Rotulo>UF</Rotulo>
        <input type="text" value={form.endereco.estado} onChange={setEndereco('estado')} placeholder="SP" maxLength={2}
          className="w-full rounded-lg px-3 py-2 text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500 uppercase"
          style={inputStyle} />
      </div>
    </div>

    <div>
      <Rotulo>Complemento</Rotulo>
      <input type="text" value={form.endereco.complemento} onChange={setEndereco('complemento')} placeholder="Sala 501"
        className="w-full rounded-lg px-3 py-2 text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        style={inputStyle} />
    </div>
  </>
);

// Remove chaves vazias do endereço antes de salvar. crm_contatos.endereco é
// NOT NULL DEFAULT '{}', então "sem endereço" é representado por {}, nunca null.
export const limparEndereco = (endereco) =>
  Object.fromEntries(
    Object.entries(endereco).map(([k, v]) => [k, (v || '').trim()]).filter(([, v]) => v)
  );

export const PORTE_LABEL = PORTE_OPCOES.reduce((acc, o) => {
  if (o.value) acc[o.value] = o.label;
  return acc;
}, {});

// Formata o endereço estruturado numa única linha legível para exibição.
export const formatarEndereco = (endereco) => {
  if (!endereco || Object.keys(endereco).length === 0) return null;
  const { logradouro, numero, complemento, bairro, cidade, estado, cep } = endereco;
  const linha1 = [logradouro, numero].filter(Boolean).join(', ');
  const linha2 = [bairro, [cidade, estado].filter(Boolean).join('/')].filter(Boolean).join(' - ');
  const partes = [linha1, complemento, linha2, cep].filter(Boolean);
  return partes.length ? partes.join(' - ') : null;
};

// Usado para decidir se a seção "Mais informações" aparece nos painéis de
// detalhe de Lead/Cliente — evita mostrar um bloco vazio.
export const temInformacoesExtras = (contato) => Boolean(
  contato.negocio_nome || contato.campanha || contato.previsao_fechamento ||
  contato.whatsapp || contato.razao_social || contato.documento ||
  contato.segmento || contato.porte || contato.site ||
  formatarEndereco(contato.endereco)
);

// Decidem se as seções recolhíveis "Mais detalhes do negócio" e "Empresa"
// já vêm abertas no modal — abertas quando editando um registro que já
// tem algo preenchido ali, fechadas ao criar um novo (contato pode ser null).
export const temDadosNegocio = (contato) => Boolean(
  contato?.negocio_nome || contato?.campanha || contato?.previsao_fechamento
);

export const temDadosEmpresa = (contato) => Boolean(
  contato?.razao_social || contato?.documento || contato?.segmento ||
  contato?.porte || contato?.site || formatarEndereco(contato?.endereco)
);
