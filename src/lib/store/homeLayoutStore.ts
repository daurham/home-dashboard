import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  DEFAULT_HIDDEN_HOME_MODULES,
  DEFAULT_HOME_ORDER,
  DEFAULT_HOME_SCALES,
  HOME_MODULES,
  moveItem,
  normalizeHomeOrder,
  normalizeHomeScales,
  visibleHomeOrder,
  withDefaultHiddenModules,
  type HomeModuleId,
  type HomeModuleScale,
} from '@/lib/home/layout';

interface HomeLayoutState {
  order: HomeModuleId[];
  hidden: HomeModuleId[];
  scales: Record<HomeModuleId, HomeModuleScale>;
  editing: boolean;
  setEditing: (editing: boolean) => void;
  moveModule: (fromId: HomeModuleId, toId: HomeModuleId) => void;
  nudgeModule: (id: HomeModuleId, direction: -1 | 1) => void;
  setModuleScale: (id: HomeModuleId, scale: HomeModuleScale) => void;
  toggleModuleScale: (id: HomeModuleId) => void;
  toggleModuleWide: (id: HomeModuleId) => void;
  hideModule: (id: HomeModuleId) => void;
  showModule: (id: HomeModuleId) => void;
  resetLayout: () => void;
}

export const useHomeLayoutStore = create<HomeLayoutState>()(
  persist(
    (set, get) => ({
      order: DEFAULT_HOME_ORDER,
      hidden: [...DEFAULT_HIDDEN_HOME_MODULES],
      scales: DEFAULT_HOME_SCALES,
      editing: false,
      setEditing: (editing) => set({ editing }),
      moveModule: (fromId, toId) => {
        set({ order: moveItem(get().order, fromId, toId) });
      },
      nudgeModule: (id, direction) => {
        const visible = visibleHomeOrder(get().order, get().hidden);
        const index = visible.indexOf(id);
        const target = visible[index + direction];
        if (!target) return;
        set({ order: moveItem(get().order, id, target) });
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
      hideModule: (id) => {
        const hidden = get().hidden;
        if (hidden.includes(id)) return;
        set({ hidden: [...hidden, id] });
      },
      showModule: (id) => {
        set({ hidden: get().hidden.filter((moduleId) => moduleId !== id) });
      },
      resetLayout: () => set({
        order: DEFAULT_HOME_ORDER,
        hidden: [...DEFAULT_HIDDEN_HOME_MODULES],
        scales: DEFAULT_HOME_SCALES,
      }),
    }),
    {
      name: 'home-layout-storage',
      partialize: (state) => ({ order: state.order, hidden: state.hidden, scales: state.scales }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<HomeLayoutState> | undefined;
        return {
          ...currentState,
          ...persisted,
          order: normalizeHomeOrder(persisted?.order),
          hidden: withDefaultHiddenModules(persisted?.order, persisted?.hidden),
          scales: normalizeHomeScales(persisted?.scales),
          editing: false,
        };
      },
    },
  ),
);
