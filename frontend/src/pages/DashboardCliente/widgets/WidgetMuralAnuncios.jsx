// =============================================================
// PRANCHETO.IA - WIDGET: MURAL DE ANÚNCIOS
// Fonte de dados: feed_postagens/feed_reacoes/feed_comentarios, os mesmos
// do módulo Feed (pages/Modulos/Feed/Feed.jsx) — não é uma tabela nova.
//
// Paginação por .range() igual ao hooks/useFeed.js, mas por página fixa
// (não "carregar mais" acumulando): o widget tem altura fixa, então trocar
// de página substitui o conteúdo em vez de crescer a lista.
//
// Corrige um bug latente do Feed: autor_nome nunca era selecionado em
// nenhuma query existente (sempre caía no fallback "Usuário"). Aqui o
// nome vem de verdade via join com users.
// =============================================================

import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase.js';
import { useAuthStore } from '../../../store/authStore.js';
import { TIPOS_POSTAGEM } from '../../../hooks/useFeed.js';
import WidgetShell from './WidgetShell.jsx';

const POR_PAGINA = 4;

const formatarTempo = (iso) => {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `${min}min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString('pt-BR');
};

const WidgetMuralAnuncios = () => {
  const navigate = useNavigate();
  const usuario = useAuthStore((s) => s.usuario);
  const tenantId = usuario?.tenant_id;

  const [postagens, setPostagens] = useState([]);
  const [pagina, setPagina] = useState(0);
  const [temMais, setTemMais] = useState(false);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async (paginaNum) => {
    if (!tenantId) return;
    setCarregando(true);
    try {
      const { data, error } = await supabase
        .from('feed_postagens')
        .select(`
          id, conteudo, tipo, fixado, criado_em,
          autor:users!feed_postagens_autor_id_fkey(id, nome),
          feed_reacoes(count),
          feed_comentarios(count)
        `)
        .eq('tenant_id', tenantId)
        .is('time_id', null)
        .order('fixado', { ascending: false })
        .order('criado_em', { ascending: false })
        .range(paginaNum * POR_PAGINA, paginaNum * POR_PAGINA + POR_PAGINA - 1);

      if (error) throw error;
      const novas = data || [];
      setPostagens(novas);
      setTemMais(novas.length === POR_PAGINA);
      setPagina(paginaNum);
    } catch (err) {
      console.error('WidgetMuralAnuncios.carregar:', err);
    } finally {
      setCarregando(false);
    }
  }, [tenantId]);

  useEffect(() => { carregar(0); }, [carregar]);

  const reagir = async (postagemId) => {
    try {
      const { error } = await supabase
        .from('feed_reacoes')
        .upsert(
          { postagem_id: postagemId, user_id: usuario?.id, emoji: '👍' },
          { onConflict: 'postagem_id,user_id,emoji' }
        );
      if (error) throw error;
      await carregar(pagina);
    } catch (err) {
      console.error('WidgetMuralAnuncios.reagir:', err);
    }
  };

  return (
    <WidgetShell titulo="Mural de Anúncios" emoji="📣" acaoLabel="Ver mural completo" onAcao={() => navigate('/modulos/feed')}>
      <div className="flex flex-col h-full">
        <div className="flex-1 space-y-3">
          {carregando ? (
            <p className="text-xs opacity-40 text-center py-4">Carregando...</p>
          ) : postagens.length === 0 ? (
            <p className="text-xs opacity-40 text-center py-4">
              {pagina === 0 ? 'Nenhuma publicação ainda.' : 'Não há publicações mais antigas.'}
            </p>
          ) : (
            postagens.map((p) => {
              const tipo = TIPOS_POSTAGEM.find((t) => t.slug === p.tipo) || TIPOS_POSTAGEM[0];
              const totalReacoes = p.feed_reacoes?.[0]?.count || 0;
              const totalComentarios = p.feed_comentarios?.[0]?.count || 0;
              return (
                <div key={p.id} className="pb-3 border-b last:border-0 last:pb-0" style={{ borderColor: 'var(--color-surface-border)' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-xs font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
                      {p.autor?.nome || 'Usuário'}
                    </p>
                    <span className="text-xs opacity-40 flex-shrink-0">{tipo.icone}</span>
                    {p.fixado && <span className="text-xs opacity-40 flex-shrink-0">📌</span>}
                    <span className="text-xs opacity-40 ml-auto flex-shrink-0">{formatarTempo(p.criado_em)}</span>
                  </div>
                  <p className="text-sm leading-relaxed line-clamp-3" style={{ color: 'var(--color-text-secondary)' }}>
                    {p.conteudo}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <button onClick={() => reagir(p.id)} className="text-xs opacity-60 hover:opacity-100 transition-opacity">
                      👍 {totalReacoes || ''}
                    </button>
                    <button onClick={() => navigate('/modulos/feed')} className="text-xs opacity-60 hover:opacity-100 transition-opacity">
                      💬 {totalComentarios || ''}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-between mt-3 pt-2 border-t flex-shrink-0" style={{ borderColor: 'var(--color-surface-border)' }}>
          <button
            onClick={() => carregar(pagina - 1)}
            disabled={pagina === 0 || carregando}
            className="text-xs opacity-60 hover:opacity-100 disabled:opacity-20 disabled:cursor-not-allowed transition-opacity"
          >
            ‹ Mais recentes
          </button>
          <button
            onClick={() => carregar(pagina + 1)}
            disabled={!temMais || carregando}
            className="text-xs opacity-60 hover:opacity-100 disabled:opacity-20 disabled:cursor-not-allowed transition-opacity"
          >
            Mais antigas ›
          </button>
        </div>
      </div>
    </WidgetShell>
  );
};

export default WidgetMuralAnuncios;
