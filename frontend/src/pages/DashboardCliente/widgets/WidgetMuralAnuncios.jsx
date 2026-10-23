// =============================================================
// PRANCHETO.IA - WIDGET: MURAL DE ANÚNCIOS (EMITLY DESIGN SYSTEM)
// Anúncios da organização em formato de timeline limpa.
// =============================================================

import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase.js';
import { useAuthStore } from '../../../store/authStore.js';
import { TIPOS_POSTAGEM } from '../../../hooks/useFeed.js';
import WidgetShell from './WidgetShell.jsx';
import { HugeiconsIcon } from '@hugeicons/react';
import { Megaphone01Icon, ThumbsUpIcon } from '@hugeicons/core-free-icons';

const POR_PAGINA = 3;

const formatarTempo = (iso) => {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `${min}m`;
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
          { postagem_id: postagemId, user_id: usuario?.id, emoji: 'like' },
          { onConflict: 'postagem_id,user_id,emoji' }
        );
      if (error) throw error;
      await carregar(pagina);
    } catch (err) {
      console.error('WidgetMuralAnuncios.reagir:', err);
    }
  };

  return (
    <WidgetShell
      titulo="Mural de Anúncios"
      icone={<HugeiconsIcon icon={Megaphone01Icon} size={16} strokeWidth={1.8} className="text-[#0E382C]" />}
    >
      <div className="flex flex-col h-full">
        <div className="flex-1 min-h-0 flex flex-col space-y-3">
          {carregando ? (
            <div className="flex-1 flex items-center justify-center py-6">
              <div className="w-5 h-5 border-2 border-[#0E382C] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : postagens.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-[#F7FAF8] rounded-xl border border-[#E4ECE7]">
              <HugeiconsIcon icon={Megaphone01Icon} size={32} strokeWidth={1.5} className="text-[#687770]/50 mb-2" />
              <p className="text-xs font-semibold text-[#687770]">
                {pagina === 0 ? 'Nenhum anúncio publicado ainda.' : 'Não há anúncios mais antigos.'}
              </p>
            </div>
          ) : (
            postagens.map((p) => {
              const totalReacoes = p.feed_reacoes?.[0]?.count || 0;
              const totalComentarios = p.feed_comentarios?.[0]?.count || 0;
              return (
                <div key={p.id} className="p-3 bg-[#F7FAF8] rounded-xl border border-[#E4ECE7] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#111915]">{p.autor?.nome || 'Usuário'}</span>
                    <span className="text-[10px] text-[#687770]">{formatarTempo(p.criado_em)}</span>
                  </div>
                  <p className="text-xs text-[#687770] leading-relaxed line-clamp-2">{p.conteudo}</p>
                  <div className="flex items-center gap-3 pt-1 border-t border-[#E4ECE7]/60">
                    <button
                      onClick={() => reagir(p.id)}
                      className="text-[10px] font-semibold text-[#0E382C] hover:bg-[#EBF0ED] px-2 py-0.5 rounded-md transition-colors flex items-center gap-1"
                    >
                      <HugeiconsIcon icon={ThumbsUpIcon} size={12} strokeWidth={1.8} />
                      <span>Curtir ({totalReacoes})</span>
                    </button>
                    <span className="text-[10px] text-[#687770]">Comentários ({totalComentarios})</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#E4ECE7] flex-shrink-0">
          <button
            onClick={() => carregar(pagina - 1)}
            disabled={pagina === 0 || carregando}
            className="text-xs font-semibold text-[#0E382C] disabled:opacity-30 disabled:cursor-not-allowed hover:underline"
          >
            ← Anúncios recentes
          </button>
          <button
            onClick={() => carregar(pagina + 1)}
            disabled={!temMais || carregando}
            className="text-xs font-semibold text-[#0E382C] disabled:opacity-30 disabled:cursor-not-allowed hover:underline"
          >
            Mais antigos →
          </button>
        </div>
      </div>
    </WidgetShell>
  );
};

export default WidgetMuralAnuncios;
