import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type SidebarTab = 'calendar' | 'devices' | 'security' | 'settings' | 'ai' | 'plants';

interface UIState {
  activeSidebarTab: SidebarTab;
  sidebarCollapsed: boolean;
  rightSidebarCollapsed: boolean;
  setActiveSidebarTab: (tab: SidebarTab) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setRightSidebarCollapsed: (collapsed: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      activeSidebarTab: 'calendar',
      sidebarCollapsed: false,
      rightSidebarCollapsed: false,
      setActiveSidebarTab: (tab) => set({ activeSidebarTab: tab }),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setRightSidebarCollapsed: (collapsed) => set({ rightSidebarCollapsed: collapsed }),
    }),
    {
      name: 'ui-storage',
    }
  )
);

