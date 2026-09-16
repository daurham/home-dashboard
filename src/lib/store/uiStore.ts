import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type SidebarTab =
  | 'home'
  | 'expenses'
  | 'chores'
  | 'calendar'
  | 'habits'
  | 'cameras'
  | 'latency'
  | 'plants'
  | 'devices'
  | 'security'
  | 'ai'
  | 'settings';

interface UIState {
  activeSidebarTab: SidebarTab;
  sidebarCollapsed: boolean;
  rightSidebarCollapsed: boolean;
  setActiveSidebarTab: (tab: SidebarTab) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setRightSidebarCollapsed: (collapsed: boolean) => void;
}

// Check if we're on mobile to set default collapsed state
const getInitialSidebarState = () => {
  if (typeof window !== 'undefined') {
    return window.innerWidth < 768; // Mobile breakpoint
  }
  return false;
};

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      activeSidebarTab: 'home',
      sidebarCollapsed: getInitialSidebarState(), // Collapsed by default on mobile
      rightSidebarCollapsed: getInitialSidebarState(), // Collapsed by default on mobile
      setActiveSidebarTab: (tab) => set({ activeSidebarTab: tab }),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setRightSidebarCollapsed: (collapsed) => set({ rightSidebarCollapsed: collapsed }),
    }),
    {
      name: 'ui-storage',
      version: 2,
      migrate: (persistedState, version) => {
        const persisted = persistedState as Partial<UIState>;
        if (version < 2) {
          return { ...persisted, activeSidebarTab: 'home' };
        }
        return persisted;
      },
    }
  )
);

