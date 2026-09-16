import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  DEFAULT_HOME_ORDER,
  DEFAULT_HOME_SCALES,
  HOME_MODULES,
  moveItem,
  normalizeHomeOrder,
  normalizeHomeScales,
  type HomeModuleId,
  type HomeModuleScale,
} from '@/lib/home/layout';

interface HomeLayoutState {
  order: HomeModuleId[];
  scales: Record<HomeModuleId, HomeModuleScale>;
  editing: boolean;
  setEditing: (editing: boolean) => void;
  moveModule: (fromId: HomeModuleId, toId: HomeModuleId) => void;
  nudgeModule: (id: HomeModuleId, direction: -1 | 1) => void;
  setModuleScale: (id: HomeModuleId, scale: HomeModuleScale) => void;
  toggleModuleScale: (id: HomeModuleId) => void;
  toggleModuleWide: (id: HomeModuleId) => void;
  resetLayout: () => void;
}

export const useHomeLayoutStore = create<HomeLayoutState>()(
  persist(
    (set, get) => ({
      order: DEFAULT_HOME_ORDER,
      scales: DEFAULT_HOME_SCALES,
      editing: false,
      setEditing: (editing) => set({ editing }),
      moveModule: (fromId, toId) => {
        set({ order: moveItem(get().order, fromId, toId) });
      },
      nudgeModule: (id, direction) => {
        const order = get().order;
        const index = order.indexOf(id);
        const target = order[index + direction];
        if (!target) return;
        set({ order: moveItem(order, id, target) });
      },
      setModuleScale: (id, scale) => {
        if (!HOME_MODULES[id].canResize) return;
        if (scale === 'wide' && !HOME_MODULES[id].canWiden) return;
        set({ scales: { ...get().scales, [id]: scale } });
      },
      toggleModuleScale: (id) => {
        if (!HOME_MODULES[id].canResize) return;
        const current = get().scales[id] ?? 'full';
        const next = current === 'compact' ? 'full' : 'compact';
        set({
          scales: {
            ...get().scales,
            [id]: current === 'wide' ? 'full' : next,
          },
        });
      },
      toggleModuleWide: (id) => {
        if (!HOME_MODULES[id].canWiden) return;
        const current = get().scales[id] ?? 'full';
        set({
          scales: {
            ...get().scales,
            [id]: current === 'wide' ? 'full' : 'wide',
          },
        });
      },
      resetLayout: () => set({ order: DEFAULT_HOME_ORDER, scales: DEFAULT_HOME_SCALES }),
    }),
    {
      name: 'home-layout-storage',
      partialize: (state) => ({ order: state.order, scales: state.scales }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<HomeLayoutState> | undefined;
        return {
          ...currentState,
          ...persisted,
          order: normalizeHomeOrder(persisted?.order),
          scales: normalizeHomeScales(persisted?.scales),
          editing: false,
        };
      },
    },
  ),
);
