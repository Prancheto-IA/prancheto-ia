// =============================================================
// PRANCHETO.IA - DETALHES DO LEAD / NEGÓCIO (EMITLY DESIGN SYSTEM)
// Layout simplificado e focado ("Menos é Mais") baseado no novo modelo
// Stepper com Chevrons, Faixa de Metadados Horizontal, Feed de Atividades
// (Notas, Reuniões, Tarefas) em Accordion e Sidebar com Métricas Reais.
// =============================================================

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase.js';
import { useAuthStore } from '../../store/authStore.js';
import {
  formatarMoeda, formatarData, formatarDataHora, tempoRelativo,
  useInteracoes,
} from '../../hooks/useCRM.js';
import { ETAPAS_PIPELINE, DEALS_DEMO, formatarK } from './Leads.jsx';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ArrowDown01Icon,
  Edit02Icon,
  Location01Icon,
  Call02Icon,
  Mail01Icon,
  WhatsappIcon,
  FlashIcon,
  CheckmarkCircle02Icon,
  Calendar03Icon,
  Note01Icon,
  Task01Icon,
  Delete02Icon,
  Copy01Icon,
} from '@hugeicons/core-free-icons';

const LeadDetalhe = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario } = useAuthStore();

  const [deal, setDeal] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState('timeline'); // timeline | notas | tarefas | reunioes

  // IA Copilot Drawer/Modal
  const [copilotInsight, setCopilotInsight] = useState(null);

  // Modal de Edição Geral
  const [modalEditar, setModalEditar] = useState(false);
  const [formEdicao, setFormEdicao] = useState({});

  // Inline Composer para Atividades
  const [criandoTipo, setCriandoTipo] = useState(null); // 'nota' | 'tarefa' | 'reuniao' | null
  const [novoTitulo, setNovoTitulo] = useState('');
  const [novoTexto, setNovoTexto] = useState('');
  const [novoPrazo, setNovoPrazo] = useState('');
  const [novoLocal, setNovoLocal] = useState('Google Meet');
  const [novaPrioridade, setNovaPrioridade] = useState('Média');

  // Atividades Locais com Accordion
  const [atividades, setAtividades] = useState([
    {
      id: 'act-1',
      tipo: 'reuniao',
      titulo: 'Alinhamento final sobre a proposta',
      descricao: 'Reunião com os tomadores de decisão para esclarecer dúvidas sobre os módulos contratados, prazos de entrega e condições comerciais.',
      local: 'Google Meet (Online)',
      prioridade: 'Alta',
      responsavel: 'Carlos Mendes',
      autor: 'Artflow Creative Agency',
      prazo: new Date(Date.now() + 2 * 86400000).toISOString(),
      criado_em: new Date(Date.now() - 3600000 * 3).toISOString(),
      concluida: false,
      expandido: true,
    },
    {
      id: 'act-2',
      tipo: 'nota',
      titulo: 'Resumo da chamada de qualificação',
      descricao: 'Cliente possui urgência na implementação do módulo de CRM e automação de atendimento via WhatsApp. Solicitou minuta da proposta com tabela de descontos progressivos.',
      local: 'Ligação Telefônica',
      prioridade: 'Média',
      responsavel: 'Carlos Mendes',
      autor: 'Artflow Creative Agency',
      prazo: null,
      criado_em: new Date(Date.now() - 86400000 * 1).toISOString(),
      concluida: true,
      expandido: true,
    },
    {
      id: 'act-3',
      tipo: 'tarefa',
      titulo: 'Enviar proposta comercial atualizada em PDF',
      descricao: 'Revisar itens adicionais solicitados pelo cliente e disparar e-mail com anexo da proposta e termo de adesão.',
      local: 'Sistema Prancheto.IA',
      prioridade: 'Alta',
      responsavel: 'Carlos Mendes',
      autor: 'Andrey',
      prazo: new Date(Date.now() + 86400000 * 4).toISOString(),
      criado_em: new Date(Date.now() - 86400000 * 2).toISOString(),
      concluida: false,
      expandido: false,
    },
  ]);

  // Carrega dados do Lead/Deal
  useEffect(() => {
    let ativo = true;

    const carregarDeal = async () => {
      setCarregando(true);
      try {
        if (id && !id.startsWith('demo-') && !id.startsWith('local-')) {
          const { data, error } = await supabase
            .from('crm_contatos')
            .select(`
              *,
              responsavel:responsavel_id (id, nome, email)
            `)
            .eq('id', id)
            .single();

          if (error) throw error;
          if (ativo && data) {
            setDeal(data);
            setFormEdicao(data);
            return;
          }
        }

        // Fallback: Busca nos deals de demonstração
        const demoEncontrado = DEALS_DEMO.find((d) => String(d.id) === String(id));
        if (ativo) {
          if (demoEncontrado) {
            setDeal(demoEncontrado);
            setFormEdicao(demoEncontrado);
          } else {
            const mock = {
              id: id || 'demo-1',
              nome: 'Mohammad Ali',
              cargo: 'Sales Manager',
              empresa: 'Widget.io',
              valor_estimado: 5600,
              score: 75,
              status_funil: 'proposta',
              tags: ['Qualificado', 'Cliente', 'Alto ROI'],
              email: 'mohammadali@gmail.com',
              telefone: '(888) 456 789',
              whatsapp: '888456789',
              cidade: 'California',
              estado: 'USA',
              responsavel: { nome: 'Artflow Creative Agency' },
              previsao_fechamento: new Date(Date.now() + 15 * 86400000).toISOString(),
              observacoes: 'Lead altamente engajado e interessado na solução completa.',
              criado_em: '2023-04-23T10:00:00Z',
              atualizado_em: new Date().toISOString(),
            };
            setDeal(mock);
            setFormEdicao(mock);
          }
        }
      } catch (err) {
        console.error('Erro ao carregar detalhes do lead:', err);
        const demoFallback = DEALS_DEMO[0];
        if (ativo) {
          setDeal(demoFallback);
          setFormEdicao(demoFallback);
        }
      } finally {
        if (ativo) setCarregando(false);
      }
    };

    carregarDeal();
    return () => { ativo = false; };
  }, [id]);

  // Hook real de interações do Supabase para persistência
  const { interacoes, adicionar: adicionarInteracaoDb } = useInteracoes(
    deal && !String(deal.id).startsWith('demo-') ? deal.id : null
  );

  // Sincroniza interações vindas do banco
  useEffect(() => {
    if (interacoes && interacoes.length > 0) {
      const mapeadas = interacoes.map(i => ({
        id: i.id,
        tipo: i.tipo === 'reuniao' ? 'reuniao' : i.tipo === 'tarefa' ? 'tarefa' : 'nota',
        titulo: i.titulo || (i.tipo === 'reuniao' ? 'Reunião agendada' : i.tipo === 'tarefa' ? 'Tarefa pendente' : 'Nota registrada'),
        descricao: i.conteudo || i.descricao || '',
        local: i.local || 'Online',
        prioridade: i.prioridade || 'Média',
        responsavel: i.criado_por_user?.nome || usuario?.nome || 'Você',
        autor: i.criado_por_user?.nome || usuario?.nome || 'Você',
        prazo: i.data_limite || null,
        criado_em: i.criado_em,
        concluida: Boolean(i.concluida),
        expandido: true,
      }));

      setAtividades(prev => {
        // Mantém as mock se não houver repetição de ID
        const idsExistentes = new Set(mapeadas.map(m => m.id));
        const restantes = prev.filter(p => !idsExistentes.has(p.id));
        return [...mapeadas, ...restantes];
      });
    }
  }, [interacoes, usuario]);

  // Alterar etapa do pipeline (Stepper)
  const handleMudarEtapa = async (novaEtapa) => {
    if (!deal) return;
    setDeal(prev => ({ ...prev, status_funil: novaEtapa, atualizado_em: new Date().toISOString() }));

    if (!String(deal.id).startsWith('demo-') && !String(deal.id).startsWith('local-')) {
      try {
        await supabase
          .from('crm_contatos')
          .update({ status_funil: novaEtapa, atualizado_em: new Date().toISOString() })
          .eq('id', deal.id);
      } catch (e) {
        console.error('Erro ao atualizar etapa:', e);
      }
    }
  };

  // Alternar expansão (Accordion)
  const toggleExpandido = (idAtividade) => {
    setAtividades(prev =>
      prev.map(a => (a.id === idAtividade ? { ...a, expandido: !a.expandido } : a))
    );
  };

  // Concluir/Alternar status de uma atividade
  const toggleConcluida = (idAtividade) => {
    setAtividades(prev =>
      prev.map(a => (a.id === idAtividade ? { ...a, concluida: !a.concluida } : a))
    );
  };

  // Excluir atividade
  const removerAtividade = (idAtividade) => {
    if (!window.confirm('Deseja remover este registro?')) return;
    setAtividades(prev => prev.filter(a => a.id !== idAtividade));
  };

  // Salvar nova atividade (Inline)
  const handleSalvarNovaAtividade = async (e) => {
    e.preventDefault();
    if (!novoTitulo.trim()) return;

    const nova = {
      id: `act-${Date.now()}`,
      tipo: criandoTipo || 'nota',
      titulo: novoTitulo.trim(),
      descricao: novoTexto.trim(),
      local: novoLocal,
      prioridade: novaPrioridade,
      responsavel: deal?.responsavel?.nome || usuario?.nome || 'Você',
      autor: usuario?.nome || 'Você',
      prazo: novoPrazo || (criandoTipo === 'reuniao' || criandoTipo === 'tarefa' ? new Date(Date.now() + 2 * 86400000).toISOString() : null),
      criado_em: new Date().toISOString(),
      concluida: false,
      expandido: true,
    };

    setAtividades(prev => [nova, ...prev]);

    // Reseta form inline
    setNovoTitulo('');
    setNovoTexto('');
    setNovoPrazo('');
    setCriandoTipo(null);

    // Persiste no Supabase se não for demo
    if (deal && !String(deal.id).startsWith('demo-')) {
      try {
        await adicionarInteracaoDb(nova.tipo, `${nova.titulo}: ${nova.descricao}`);
      } catch (err) {
        console.error('Erro ao persistir atividade:', err);
      }
    }
  };

  // Salvar Edição Geral
  const handleSalvarEdicao = async (e) => {
    e.preventDefault();
    setSalvando(true);
    try {
      setDeal(prev => ({ ...prev, ...formEdicao, atualizado_em: new Date().toISOString() }));

      if (deal && !String(deal.id).startsWith('demo-') && !String(deal.id).startsWith('local-')) {
        await supabase
          .from('crm_contatos')
          .update({
            nome: formEdicao.nome,
            cargo: formEdicao.cargo,
            empresa: formEdicao.empresa,
            valor_estimado: formEdicao.valor_estimado ? Number(formEdicao.valor_estimado) : null,
            email: formEdicao.email,
            telefone: formEdicao.telefone,
            whatsapp: formEdicao.whatsapp,
            cidade: formEdicao.cidade,
            estado: formEdicao.estado,
            observacoes: formEdicao.observacoes,
            previsao_fechamento: formEdicao.previsao_fechamento || null,
            atualizado_em: new Date().toISOString(),
          })
          .eq('id', deal.id);
      }
      setModalEditar(false);
    } catch (err) {
      console.error('Erro ao atualizar negócio:', err);
    } finally {
      setSalvando(false);
    }
  };

  // Copiloto IA
  const dispararCopilot = (tipo) => {
    const nomeNegocio = deal?.nome || 'este lead';
    const valor = formatarMoeda(deal?.valor_estimado || 0);

    if (tipo === 'proxima_acao') {
      setCopilotInsight({
        titulo: 'Próxima Melhor Ação Recomendada',
        subtitulo: `Baseada na etapa atual de ${etapaAtual?.titulo || 'Funil'} e ticket de ${valor}`,
        itens: [
          `1. Envie um WhatsApp objetivo confirmando o recebimento da proposta comercial.`,
          `2. Agende uma breve chamada de 15 minutos focada em sanar dúvidas contratuais.`,
          `3. Reforce o diferencial de retorno sobre o investimento (ROI) para acelerar a decisão.`,
        ],
      });
    } else if (tipo === 'mensagem_whatsapp') {
      const msg = `Olá ${deal?.nome?.split(' ')[0] || ''}, tudo bem? Aqui é o ${usuario?.nome || 'Carlos'} do Prancheto.IA. Preparei a proposta customizada para a ${deal?.empresa || 'sua empresa'} e gostaria de alinhar rapidamente os próximos passos. Que tal um papo de 10 minutinhos hoje?`;
      navigator.clipboard?.writeText(msg);
      alert('Mensagem recomendada copiada para a área de transferência! Cole no WhatsApp.');
    }
  };

  if (carregando && !deal) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-[#0E382C] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-[#687770]">Carregando detalhes do lead...</p>
        </div>
      </div>
    );
  }

  if (!deal) return null;

  // Encontra a etapa atual com base no deal
  const etapaAtualIndex = ETAPAS_PIPELINE.findIndex(e => e.key === deal.status_funil);
  const etapaAtual = ETAPAS_PIPELINE[etapaAtualIndex >= 0 ? etapaAtualIndex : 0];

  // Filtro por abas
  const atividadesFiltradas = atividades.filter(a => {
    if (abaAtiva === 'timeline') return true;
    if (abaAtiva === 'notas') return a.tipo === 'nota';
    if (abaAtiva === 'tarefas') return a.tipo === 'tarefa';
    if (abaAtiva === 'reunioes') return a.tipo === 'reuniao';
    return true;
  });

  const contagemNotas = atividades.filter(a => a.tipo === 'nota').length;
  const contagemTarefas = atividades.filter(a => a.tipo === 'tarefa').length;
  const contagemReunioes = atividades.filter(a => a.tipo === 'reuniao').length;

  return (
    <div className="w-full flex-1 flex flex-col font-sans pb-12">
      {/* ─────────────────────────────────────────────────────────
          1. NAVEGAÇÃO SUPERIOR: BOTÃO VOLTAR & EDITAR
         ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigate('/crm/leads')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#687770] hover:text-[#0E382C] transition-colors group"
        >
          <div className="w-7 h-7 rounded-full border border-[#E4ECE7] bg-white group-hover:border-[#0E382C] group-hover:bg-[#F7FAF8] flex items-center justify-center transition-all shadow-sm">
            <HugeiconsIcon icon={ArrowLeft01Icon} size={14} strokeWidth={2} />
          </div>
          <span>Voltar para negócios</span>
        </button>

        <button
          onClick={() => setModalEditar(true)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0E382C] bg-white border border-[#E4ECE7] hover:bg-[#F7FAF8] hover:border-[#CCD9D2] px-3.5 py-1.5 rounded-xl transition-all shadow-sm"
        >
          <HugeiconsIcon icon={Edit02Icon} size={14} strokeWidth={2} className="text-[#0E382C]" />
          <span>Editar Informações</span>
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────
          2. CARTÃO PRINCIPAL: CABEÇALHO + METADADOS HORIZONTAIS
         ───────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#E4ECE7] p-5 sm:p-6 shadow-sm mb-5">
        {/* Linha Superior: Avatar, Nome, Local, Telefone e Ações de Contato Rápidas */}
        <div className="flex items-center justify-between flex-wrap gap-4 pb-5 border-b border-[#E4ECE7]">
          <div className="flex items-center gap-4">
            {/* Avatar em Verde Emitly */}
            <div className="w-14 h-14 rounded-full bg-[#0E382C] text-white flex items-center justify-center font-bold text-lg ring-4 ring-[#E4ECE7] shadow-sm flex-shrink-0">
              {deal.nome ? deal.nome.slice(0, 2).toUpperCase() : 'LE'}
            </div>

            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#111915] tracking-tight">
                {deal.nome || 'Lead Sem Nome'}
              </h1>
              <div className="flex items-center gap-4 mt-1 flex-wrap text-xs text-[#687770]">
                {/* Localização */}
                <span className="flex items-center gap-1.5">
                  <HugeiconsIcon icon={Location01Icon} size={14} strokeWidth={1.8} className="text-[#99A6A0]" />
                  <span>{deal.cidade ? `${deal.cidade}, ${deal.estado || 'BR'}` : 'São Paulo, Brasil'}</span>
                </span>
                {/* Telefone */}
                <span className="flex items-center gap-1.5 font-medium text-[#111915]">
                  <HugeiconsIcon icon={Call02Icon} size={14} strokeWidth={1.8} className="text-[#99A6A0]" />
                  <span>{deal.telefone || deal.whatsapp || '(11) 98765-4321'}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Ações de Contato Direto (Menos é Mais: sem ícones de redes sociais irrelevantes) */}
          <div className="flex items-center gap-2">
            {/* E-mail */}
            <a
              href={`mailto:${deal.email || ''}`}
              title="Enviar e-mail"
              className="w-9 h-9 rounded-full border border-[#E4ECE7] bg-white hover:border-[#0E382C] hover:bg-[#F7FAF8] text-[#687770] hover:text-[#0E382C] flex items-center justify-center transition-all shadow-sm"
            >
              <HugeiconsIcon icon={Mail01Icon} size={16} strokeWidth={1.8} />
            </a>

            {/* Telefone */}
            <a
              href={`tel:${deal.telefone || deal.whatsapp || ''}`}
              title="Ligar"
              className="w-9 h-9 rounded-full border border-[#E4ECE7] bg-white hover:border-[#0E382C] hover:bg-[#F7FAF8] text-[#687770] hover:text-[#0E382C] flex items-center justify-center transition-all shadow-sm"
            >
              <HugeiconsIcon icon={Call02Icon} size={16} strokeWidth={1.8} />
            </a>

            {/* WhatsApp */}
            <a
              href={`https://wa.me/${(deal.whatsapp || deal.telefone || '').replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              title="Abrir WhatsApp"
              className="w-9 h-9 rounded-full border border-[#E4ECE7] bg-white hover:border-emerald-600 hover:bg-emerald-50 text-[#687770] hover:text-emerald-700 flex items-center justify-center transition-all shadow-sm"
            >
              <HugeiconsIcon icon={WhatsappIcon} size={16} strokeWidth={1.8} />
            </a>

            {/* Copiloto IA (Dica rápida de fechamento) */}
            <button
              onClick={() => dispararCopilot('proxima_acao')}
              title="Copiloto IA: Sugestão Estratégica"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#D4EC9D] bg-[#F7FAF8] hover:bg-[#EBF5EC] text-[#0E382C] text-xs font-semibold transition-all shadow-sm ml-1"
            >
              <HugeiconsIcon icon={FlashIcon} size={14} strokeWidth={2} className="text-[#0E382C]" />
              <span>Copiloto IA</span>
            </button>
          </div>
        </div>

        {/* Linha Inferior: Faixa de Metadados Horizontal Clean */}
        <div className="pt-4 overflow-x-auto no-scrollbar">
          <div className="flex items-center min-w-max divide-x divide-[#E4ECE7] text-xs">
            {/* Cargo */}
            <div className="pr-4 sm:pr-5 flex flex-col">
              <span className="text-[10px] font-semibold text-[#687770] uppercase tracking-wider mb-0.5">Cargo</span>
              <span className="font-semibold text-[#111915]">{deal.cargo || 'Diretor Comercial'}</span>
            </div>

            {/* Empresa */}
            <div className="px-4 sm:px-5 flex flex-col">
              <span className="text-[10px] font-semibold text-[#687770] uppercase tracking-wider mb-0.5">Empresa</span>
              <span className="font-semibold text-[#111915]">{deal.empresa || 'Widget.io'}</span>
            </div>

            {/* E-mail */}
            <div className="px-4 sm:px-5 flex flex-col">
              <span className="text-[10px] font-semibold text-[#687770] uppercase tracking-wider mb-0.5">E-mail</span>
              <span className="font-medium text-[#111915]">{deal.email || 'contato@empresa.com'}</span>
            </div>

            {/* Telefone */}
            <div className="px-4 sm:px-5 flex flex-col">
              <span className="text-[10px] font-semibold text-[#687770] uppercase tracking-wider mb-0.5">Telefone</span>
              <span className="font-medium text-[#111915]">{deal.telefone || deal.whatsapp || '-'}</span>
            </div>

            {/* Valor Estimado */}
            <div className="px-4 sm:px-5 flex flex-col">
              <span className="text-[10px] font-semibold text-[#687770] uppercase tracking-wider mb-0.5">Valor Estimado</span>
              <span className="font-bold text-[#0E382C]">{formatarMoeda(deal.valor_estimado || 0)}</span>
            </div>

            {/* Responsável */}
            <div className="px-4 sm:px-5 flex flex-col">
              <span className="text-[10px] font-semibold text-[#687770] uppercase tracking-wider mb-0.5">Responsável</span>
              <span className="font-semibold text-[#111915]">{deal.responsavel?.nome || 'Artflow Creative'}</span>
            </div>

            {/* Criado em */}
            <div className="px-4 sm:px-5 flex flex-col">
              <span className="text-[10px] font-semibold text-[#687770] uppercase tracking-wider mb-0.5">Criado em</span>
              <span className="font-medium text-[#111915]">{formatarData(deal.criado_em)}</span>
            </div>

            {/* Tags */}
            <div className="pl-4 sm:pl-5 flex flex-col">
              <span className="text-[10px] font-semibold text-[#687770] uppercase tracking-wider mb-1">Tags</span>
              <div className="flex items-center gap-1.5">
                {(deal.tags && deal.tags.length > 0 ? deal.tags : ['Novo', 'Cliente']).map((tag, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#EBF5EC] text-[#0E382C] border border-[#D4EC9D]/50"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────
          3. PIPELINE STEPPER: APENAS OS CHEVRONS INTUITIVOS
         ───────────────────────────────────────────────────────── */}
      <div className="flex items-stretch gap-1.5 overflow-x-auto no-scrollbar w-full mb-6 py-1">
        {ETAPAS_PIPELINE.map((etapa, idx) => {
          const isPassado = etapaAtualIndex > idx;
          const isAtual = etapaAtualIndex === idx;

          // Formatação do chevron com corte e sombra nos contornos
          const clipStyle = {
            clipPath: idx === 0
              ? 'polygon(0% 0%, calc(100% - 14px) 0%, 100% 50%, calc(100% - 14px) 100%, 0% 100%)'
              : idx === ETAPAS_PIPELINE.length - 1
              ? 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 14px 50%)'
              : 'polygon(0% 0%, calc(100% - 14px) 0%, 100% 50%, calc(100% - 14px) 100%, 0% 100%, 14px 50%)',
            borderRadius: idx === 0 ? '8px 0 0 8px' : idx === ETAPAS_PIPELINE.length - 1 ? '0 8px 8px 0' : '0',
            filter: isAtual
              ? 'drop-shadow(0 2px 5px rgba(14, 56, 44, 0.28))'
              : 'drop-shadow(0 1px 3px rgba(14, 56, 44, 0.08))',
          };

          return (
            <button
              key={etapa.key}
              type="button"
              onClick={() => handleMudarEtapa(etapa.key)}
              className={`flex-1 min-w-[130px] h-11 px-4 flex items-center justify-center transition-all duration-150 select-none text-xs font-semibold
                ${isAtual
                  ? 'bg-[#0E382C] text-white'
                  : isPassado
                  ? 'bg-[#D2EBD7] text-[#0A4D34] hover:bg-[#C0E2C7]'
                  : 'bg-[#D8E2DC] text-[#24362D] hover:bg-[#CBD7D0] hover:text-[#0E382C]'
                }
              `}
              style={clipStyle}
              title={`Mover para ${etapa.titulo}`}
            >
              <div className="flex items-center gap-1.5 truncate">
                {(isPassado || isAtual) && (
                  <HugeiconsIcon
                    icon={CheckmarkCircle02Icon}
                    size={14}
                    strokeWidth={2.5}
                    className={`flex-shrink-0 ${isAtual ? 'text-[#D4EC9D]' : 'text-[#0A4D34]'}`}
                  />
                )}
                <span className="truncate">{etapa.titulo}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* ─────────────────────────────────────────────────────────
          4. CORPO PRINCIPAL EM DUAS COLUNAS: FEED & SIDEBAR
         ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* COLUNA ESQUERDA: FEED DE ATIVIDADES E ABAS (~67% de largura) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Barra de Abas e Botão Rápido de Adição */}
          <div className="bg-white rounded-2xl border border-[#E4ECE7] p-4 shadow-sm flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => setAbaAtiva('timeline')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  abaAtiva === 'timeline'
                    ? 'bg-[#0E382C] text-white shadow-sm'
                    : 'text-[#687770] hover:text-[#111915] hover:bg-[#F7FAF8]'
                }`}
              >
                <HugeiconsIcon icon={FlashIcon} size={14} strokeWidth={2} />
                <span>Linha do Tempo</span>
              </button>

              <button
                onClick={() => setAbaAtiva('notas')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  abaAtiva === 'notas'
                    ? 'bg-[#0E382C] text-white shadow-sm'
                    : 'text-[#687770] hover:text-[#111915] hover:bg-[#F7FAF8]'
                }`}
              >
                <span>Notas</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${abaAtiva === 'notas' ? 'bg-[#D4EC9D] text-[#0E382C]' : 'bg-[#EBF0ED] text-[#687770]'}`}>
                  {contagemNotas}
                </span>
              </button>

              <button
                onClick={() => setAbaAtiva('tarefas')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  abaAtiva === 'tarefas'
                    ? 'bg-[#0E382C] text-white shadow-sm'
                    : 'text-[#687770] hover:text-[#111915] hover:bg-[#F7FAF8]'
                }`}
              >
                <span>Tarefas</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${abaAtiva === 'tarefas' ? 'bg-[#D4EC9D] text-[#0E382C]' : 'bg-[#EBF0ED] text-[#687770]'}`}>
                  {contagemTarefas}
                </span>
              </button>

              <button
                onClick={() => setAbaAtiva('reunioes')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  abaAtiva === 'reunioes'
                    ? 'bg-[#0E382C] text-white shadow-sm'
                    : 'text-[#687770] hover:text-[#111915] hover:bg-[#F7FAF8]'
                }`}
              >
                <span>Reuniões</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${abaAtiva === 'reunioes' ? 'bg-[#D4EC9D] text-[#0E382C]' : 'bg-[#EBF0ED] text-[#687770]'}`}>
                  {contagemReunioes}
                </span>
              </button>
            </div>

            {/* Botões de Ação Inline */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCriandoTipo(criandoTipo === 'reuniao' ? null : 'reuniao')}
                className="px-2.5 py-1.5 rounded-lg border border-[#E4ECE7] text-xs font-semibold text-[#0E382C] hover:bg-[#F7FAF8] transition-colors"
              >
                + Reunião
              </button>
              <button
                onClick={() => setCriandoTipo(criandoTipo === 'tarefa' ? null : 'tarefa')}
                className="px-2.5 py-1.5 rounded-lg border border-[#E4ECE7] text-xs font-semibold text-[#0E382C] hover:bg-[#F7FAF8] transition-colors"
              >
                + Tarefa
              </button>
              <button
                onClick={() => setCriandoTipo(criandoTipo === 'nota' ? null : 'nota')}
                className="px-2.5 py-1.5 rounded-lg bg-[#0E382C] text-white text-xs font-semibold hover:bg-[#07261E] transition-colors shadow-sm"
              >
                + Nota
              </button>
            </div>
          </div>

          {/* Form Inline Expansível para Nova Atividade */}
          {criandoTipo && (
            <div className="bg-white rounded-2xl border-2 border-[#0E382C] p-4 shadow-md transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-[#0E382C] uppercase tracking-wider">
                  {criandoTipo === 'reuniao' && 'Nova Reunião'}
                  {criandoTipo === 'tarefa' && 'Nova Tarefa'}
                  {criandoTipo === 'nota' && 'Nova Nota Rápida'}
                </span>
                <button
                  type="button"
                  onClick={() => setCriandoTipo(null)}
                  className="text-xs text-[#687770] hover:text-[#111915]"
                >
                  ✕ Cancelar
                </button>
              </div>

              <form onSubmit={handleSalvarNovaAtividade} className="space-y-3">
                <input
                  type="text"
                  placeholder={
                    criandoTipo === 'reuniao'
                      ? 'Ex: Apresentação da Proposta Comercial'
                      : criandoTipo === 'tarefa'
                      ? 'Ex: Enviar minuta revisada com descontos'
                      : 'Ex: Resumo da conversa de alinhamento'
                  }
                  value={novoTitulo}
                  onChange={(e) => setNovoTitulo(e.target.value)}
                  className="w-full text-xs font-semibold text-[#111915] border border-[#E4ECE7] rounded-xl px-3 py-2 focus:outline-none focus:border-[#0E382C]"
                  autoFocus
                />

                <textarea
                  rows={2}
                  placeholder="Detalhes ou anotações adicionais..."
                  value={novoTexto}
                  onChange={(e) => setNovoTexto(e.target.value)}
                  className="w-full text-xs text-[#111915] border border-[#E4ECE7] rounded-xl px-3 py-2 focus:outline-none focus:border-[#0E382C]"
                />

                <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                  <div className="flex items-center gap-2">
                    {criandoTipo !== 'nota' && (
                      <input
                        type="date"
                        value={novoPrazo}
                        onChange={(e) => setNovoPrazo(e.target.value)}
                        className="text-xs border border-[#E4ECE7] rounded-lg px-2.5 py-1 text-[#687770]"
                      />
                    )}
                    <select
                      value={novaPrioridade}
                      onChange={(e) => setNovaPrioridade(e.target.value)}
                      className="text-xs border border-[#E4ECE7] rounded-lg px-2 py-1 text-[#687770]"
                    >
                      <option value="Baixa">Prioridade: Baixa</option>
                      <option value="Média">Prioridade: Média</option>
                      <option value="Alta">Prioridade: Alta</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-[#0E382C] text-white text-xs font-semibold hover:bg-[#07261E] shadow-sm"
                  >
                    Salvar Registro
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Lista de Atividades em Accordion (Estilo Idêntico ao Screenshot) */}
          <div className="space-y-4">
            {atividadesFiltradas.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#E4ECE7] p-8 text-center text-xs text-[#687770]">
                Nenhuma atividade registrada nesta aba. Clique nos botões acima para adicionar.
              </div>
            ) : (
              atividadesFiltradas.map((act) => {
                const isReuniao = act.tipo === 'reuniao';
                const isNota = act.tipo === 'nota';
                const isTarefa = act.tipo === 'tarefa';

                // Cores sutis de fundo do cabeçalho
                const headerBg = isReuniao ? 'bg-[#F4F8FA]' : isNota ? 'bg-[#F2F7F4]' : 'bg-[#FAF8F2]';

                return (
                  <div
                    key={act.id}
                    className="bg-white rounded-2xl border border-[#E4ECE7] overflow-hidden shadow-sm hover:border-[#CCD9D2] transition-all"
                  >
                    {/* Cabeçalho do Card (Accordion Bar) */}
                    <div
                      className={`px-4 sm:px-5 py-3 ${headerBg} border-b border-[#E4ECE7] flex items-center justify-between cursor-pointer select-none`}
                      onClick={() => toggleExpandido(act.id)}
                    >
                      <div className="flex items-center gap-3">
                        {/* Ícone de expansão */}
                        <HugeiconsIcon
                          icon={ArrowDown01Icon}
                          size={14}
                          strokeWidth={2}
                          className={`text-[#687770] transition-transform duration-200 ${
                            act.expandido ? 'rotate-180' : ''
                          }`}
                        />

                        {/* Ícone do Tipo */}
                        <div className="w-6 h-6 rounded-lg bg-white border border-[#E4ECE7] flex items-center justify-center text-[#0E382C] shadow-2xs">
                          {isReuniao && (
                            <HugeiconsIcon icon={Calendar03Icon} size={14} strokeWidth={2} className="text-blue-700" />
                          )}
                          {isNota && (
                            <HugeiconsIcon icon={Note01Icon} size={14} strokeWidth={2} className="text-emerald-700" />
                          )}
                          {isTarefa && (
                            <HugeiconsIcon icon={Task01Icon} size={14} strokeWidth={2} className="text-amber-700" />
                          )}
                        </div>

                        {/* Rótulo e Autor */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-[#111915]">
                            {isReuniao && `Reunião registrada por ${act.autor}`}
                            {isNota && `Nota criada por ${act.autor}`}
                            {isTarefa && `Tarefa delegada por ${act.autor}`}
                          </span>
                          <span className="text-[11px] text-[#99A6A0]">
                            • {formatarDataHora(act.criado_em)}
                          </span>
                        </div>
                      </div>

                      {/* Botões de Ação na Barra */}
                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => removerAtividade(act.id)}
                          title="Excluir"
                          className="w-7 h-7 rounded-lg text-[#99A6A0] hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors"
                        >
                          <HugeiconsIcon icon={Delete02Icon} size={14} strokeWidth={2} />
                        </button>
                      </div>
                    </div>

                    {/* Conteúdo Expansível do Accordion */}
                    {act.expandido && (
                      <div className="p-4 sm:p-5 space-y-3.5">
                        {/* Título & Descrição */}
                        <div>
                          <h3 className="text-sm font-bold text-[#111915] mb-1">
                            {act.titulo}
                          </h3>
                          <p className="text-xs text-[#687770] leading-relaxed">
                            {act.descricao}
                          </p>
                        </div>

                        {/* Linha de Metadados: Local, Prioridade, Responsável */}
                        <div className="flex items-center gap-4 flex-wrap text-xs text-[#687770] pt-1">
                          {act.local && (
                            <span className="flex items-center gap-1.5">
                              <span className="text-[#99A6A0]">Local:</span>
                              <span className="font-semibold text-[#111915]">{act.local}</span>
                            </span>
                          )}

                          <span className="flex items-center gap-1.5">
                            <span className="text-[#99A6A0]">Prioridade:</span>
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                act.prioridade === 'Alta'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : act.prioridade === 'Média'
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                act.prioridade === 'Alta' ? 'bg-rose-600' : act.prioridade === 'Média' ? 'bg-amber-600' : 'bg-emerald-600'
                              }`} />
                              {act.prioridade}
                            </span>
                          </span>

                          <span className="flex items-center gap-1.5">
                            <span className="text-[#99A6A0]">Responsável:</span>
                            <span className="font-semibold text-[#111915]">{act.responsavel}</span>
                          </span>
                        </div>

                        {/* Rodapé: Prazo de Vencimento e Botão de Conclusão */}
                        <div className="flex items-center justify-between pt-3 border-t border-[#E4ECE7] flex-wrap gap-2">
                          <div className="flex items-center gap-1.5 text-xs text-[#687770]">
                            <HugeiconsIcon icon={Calendar03Icon} size={14} strokeWidth={2} className="text-[#99A6A0]" />
                            <span>
                              {act.prazo
                                ? `Vencimento: ${formatarData(act.prazo)}`
                                : 'Sem data de vencimento'}
                            </span>
                          </div>

                          <button
                            onClick={() => toggleConcluida(act.id)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                              act.concluida
                                ? 'bg-[#EBF5EC] text-[#0E382C] border border-[#D4EC9D]'
                                : 'bg-white border border-[#0E382C] text-[#0E382C] hover:bg-[#F7FAF8]'
                            }`}
                          >
                            <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} strokeWidth={2.5} />
                            <span>{act.concluida ? 'Concluída' : 'Marcar como concluída'}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* COLUNA DIREITA: SIDEBAR LIMPA & METRIFICAÇÃO (~33% de largura) */}
        <div className="space-y-4">
          {/* Card 1: Resumo do Negócio & Probabilidade */}
          <div className="bg-white rounded-2xl border border-[#E4ECE7] p-5 shadow-sm">
            <h2 className="text-xs font-bold text-[#111915] uppercase tracking-wider mb-3">
              Métricas do Negócio
            </h2>

            <div className="space-y-3.5">
              <div>
                <span className="text-[11px] text-[#687770]">Valor do Negócio</span>
                <p className="text-2xl font-bold text-[#0E382C] tracking-tight">
                  {formatarMoeda(deal.valor_estimado || 0)}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-[#687770]">Probabilidade de Sucesso</span>
                  <span className="font-bold text-[#0E382C]">{deal.score || etapaAtual?.probabilidadePadrao || 70}%</span>
                </div>
                {/* Barra de Progresso Suave */}
                <div className="w-full bg-[#EBF0ED] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#0E382C] h-full rounded-full transition-all duration-500"
                    style={{ width: `${deal.score || etapaAtual?.probabilidadePadrao || 70}%` }}
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-[#E4ECE7] flex items-center justify-between text-xs">
                <span className="text-[#687770]">Previsão de Fechamento</span>
                <span className="font-semibold text-[#111915]">
                  {deal.previsao_fechamento ? formatarData(deal.previsao_fechamento) : 'Definir data'}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Negócios Recentes (Estilo Idêntico ao Screenshot) */}
          <div className="bg-white rounded-2xl border border-[#E4ECE7] p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-[#111915] uppercase tracking-wider">
                Negócios Relacionados
              </h2>
              <span className="text-[10px] text-[#687770] font-medium">Conta</span>
            </div>

            {/* Deal Item 1 */}
            <div className="p-3.5 rounded-xl border border-[#E4ECE7] bg-[#F7FAF8] hover:border-[#0E382C] hover:bg-white transition-all group cursor-pointer">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-white border border-[#E4ECE7] flex items-center justify-center text-xs font-bold text-[#0E382C]">
                    $
                  </div>
                  <span className="text-xs font-bold text-[#111915]">Expansão de Licenças</span>
                </div>
                <HugeiconsIcon icon={ArrowRight01Icon} size={16} strokeWidth={2} className="text-[#99A6A0] group-hover:text-[#0E382C] group-hover:translate-x-0.5 transition-all" />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#0E382C]">R$ 5.600</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-800">
                  Proposta
                </span>
              </div>
              <p className="text-[11px] text-[#687770] mt-1">{deal.empresa || 'Widget.io'}</p>
            </div>

            {/* Deal Item 2 */}
            <div className="p-3.5 rounded-xl border border-[#E4ECE7] bg-[#F7FAF8] hover:border-[#0E382C] hover:bg-white transition-all group cursor-pointer">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-white border border-[#E4ECE7] flex items-center justify-center text-xs font-bold text-[#0E382C]">
                    $
                  </div>
                  <span className="text-xs font-bold text-[#111915]">Suporte e Onboarding</span>
                </div>
                <HugeiconsIcon icon={ArrowRight01Icon} size={16} strokeWidth={2} className="text-[#99A6A0] group-hover:text-[#0E382C] group-hover:translate-x-0.5 transition-all" />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#0E382C]">R$ 1.200</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                  Fechamento
                </span>
              </div>
              <p className="text-[11px] text-[#687770] mt-1">{deal.empresa || 'Widget.io'}</p>
            </div>
          </div>

          {/* Card 3: Assistente de Fechamento (Copiloto IA) */}
          <div className="bg-[#F7FAF8] rounded-2xl border border-[#D4EC9D] p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#0E382C] text-[#D4EC9D] flex items-center justify-center">
                <HugeiconsIcon icon={FlashIcon} size={14} strokeWidth={2} />
              </div>
              <h2 className="text-xs font-bold text-[#0E382C] uppercase tracking-wider">
                Copiloto IA
              </h2>
            </div>

            <p className="text-xs text-[#111915] leading-relaxed">
              O lead está na etapa de <strong>{etapaAtual?.titulo}</strong>. Recomendamos alinhamento imediato via WhatsApp para validação de escopo.
            </p>

            <button
              onClick={() => dispararCopilot('mensagem_whatsapp')}
              className="w-full py-2 px-3 rounded-xl bg-white border border-[#0E382C] text-[#0E382C] hover:bg-[#0E382C] hover:text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
            >
              <HugeiconsIcon icon={Copy01Icon} size={14} strokeWidth={2} />
              <span>Copiar Mensagem WhatsApp</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────
          5. MODAL DE EDIÇÃO COMPLETA DO LEAD
         ───────────────────────────────────────────────────────── */}
      {modalEditar && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E4ECE7] shadow-xl max-w-lg w-full overflow-hidden animate-fade-in">
            <div className="px-6 py-4 border-b border-[#E4ECE7] flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#111915]">Editar Informações do Lead</h2>
              <button
                onClick={() => setModalEditar(false)}
                className="text-[#687770] hover:text-[#111915] text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSalvarEdicao} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#687770] mb-1">Nome Completo</label>
                  <input
                    type="text"
                    value={formEdicao.nome || ''}
                    onChange={(e) => setFormEdicao(prev => ({ ...prev, nome: e.target.value }))}
                    className="w-full text-xs border border-[#E4ECE7] rounded-xl px-3 py-2 text-[#111915] focus:outline-none focus:border-[#0E382C]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#687770] mb-1">Cargo</label>
                  <input
                    type="text"
                    value={formEdicao.cargo || ''}
                    onChange={(e) => setFormEdicao(prev => ({ ...prev, cargo: e.target.value }))}
                    className="w-full text-xs border border-[#E4ECE7] rounded-xl px-3 py-2 text-[#111915] focus:outline-none focus:border-[#0E382C]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#687770] mb-1">Empresa</label>
                  <input
                    type="text"
                    value={formEdicao.empresa || ''}
                    onChange={(e) => setFormEdicao(prev => ({ ...prev, empresa: e.target.value }))}
                    className="w-full text-xs border border-[#E4ECE7] rounded-xl px-3 py-2 text-[#111915] focus:outline-none focus:border-[#0E382C]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#687770] mb-1">Valor Estimado (R$)</label>
                  <input
                    type="number"
                    value={formEdicao.valor_estimado || ''}
                    onChange={(e) => setFormEdicao(prev => ({ ...prev, valor_estimado: e.target.value }))}
                    className="w-full text-xs border border-[#E4ECE7] rounded-xl px-3 py-2 text-[#111915] focus:outline-none focus:border-[#0E382C]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#687770] mb-1">E-mail</label>
                  <input
                    type="email"
                    value={formEdicao.email || ''}
                    onChange={(e) => setFormEdicao(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full text-xs border border-[#E4ECE7] rounded-xl px-3 py-2 text-[#111915] focus:outline-none focus:border-[#0E382C]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#687770] mb-1">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    value={formEdicao.telefone || formEdicao.whatsapp || ''}
                    onChange={(e) => setFormEdicao(prev => ({ ...prev, telefone: e.target.value, whatsapp: e.target.value }))}
                    className="w-full text-xs border border-[#E4ECE7] rounded-xl px-3 py-2 text-[#111915] focus:outline-none focus:border-[#0E382C]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#687770] mb-1">Observações</label>
                <textarea
                  rows={3}
                  value={formEdicao.observacoes || ''}
                  onChange={(e) => setFormEdicao(prev => ({ ...prev, observacoes: e.target.value }))}
                  className="w-full text-xs border border-[#E4ECE7] rounded-xl px-3 py-2 text-[#111915] focus:outline-none focus:border-[#0E382C]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E4ECE7]">
                <button
                  type="button"
                  onClick={() => setModalEditar(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#687770] hover:text-[#111915]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#0E382C] hover:bg-[#07261E] rounded-xl shadow-sm transition-all"
                >
                  {salvando ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────
          6. MODAL DO COPILOTO IA
         ───────────────────────────────────────────────────────── */}
      {copilotInsight && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#D4EC9D] shadow-xl max-w-md w-full overflow-hidden p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#0E382C] text-[#D4EC9D] flex items-center justify-center">
                  <HugeiconsIcon icon={FlashIcon} size={16} strokeWidth={2} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#111915]">{copilotInsight.titulo}</h2>
                  <p className="text-[11px] text-[#687770]">{copilotInsight.subtitulo}</p>
                </div>
              </div>
              <button
                onClick={() => setCopilotInsight(null)}
                className="text-[#687770] hover:text-[#111915] text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 bg-[#F7FAF8] p-4 rounded-xl border border-[#E4ECE7]">
              {copilotInsight.itens?.map((item, idx) => (
                <p key={idx} className="text-xs text-[#111915] leading-relaxed">
                  {item}
                </p>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setCopilotInsight(null)}
                className="px-4 py-2 rounded-xl bg-[#0E382C] text-white text-xs font-semibold hover:bg-[#07261E]"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadDetalhe;
