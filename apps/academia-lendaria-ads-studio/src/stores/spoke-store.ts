import { create } from 'zustand';
import type { Spoke } from '@/lib/types';

/**
 * Estado global do spoke ativo (AC2/AC3 — STORY-AL-ADS-1.2).
 *
 * O spoke ativo é o eixo de re-escopo: trocá-lo muda o `workspace_id` que toda
 * query de dados filtra. A RLS no backend garante o isolamento de verdade
 * (R7 provado 6/6); este estado só carrega o contexto correto para a UI.
 *
 * Zustand escolhido por ser o store global mais simples (a app não usava nenhum
 * ainda) — sem boilerplate de Context/reducer.
 */
interface SpokeState {
  /** Spokes aos quais o usuário pertence (via `workspace_members`). */
  spokes: Spoke[];
  /** Spoke ativo — null até auth + carregamento da lista. */
  activeSpokeId: string | null;
  setSpokes: (spokes: Spoke[]) => void;
  /** Troca o spoke ativo → re-escopa a UI (AC2). */
  setActiveSpoke: (spokeId: string) => void;
  /** Limpa o contexto (logout). */
  reset: () => void;
}

export const useSpokeStore = create<SpokeState>((set) => ({
  spokes: [],
  activeSpokeId: null,
  setSpokes: (spokes) =>
    set((state) => ({
      spokes,
      // Mantém o ativo se ainda for membro; senão cai no primeiro.
      activeSpokeId:
        state.activeSpokeId && spokes.some((s) => s.id === state.activeSpokeId)
          ? state.activeSpokeId
          : (spokes[0]?.id ?? null),
    })),
  setActiveSpoke: (spokeId) => set({ activeSpokeId: spokeId }),
  reset: () => set({ spokes: [], activeSpokeId: null }),
}));
