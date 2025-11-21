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
      activeSidebarTab: 'calendar',
      sidebarCollapsed: getInitialSidebarState(), // Collapsed by default on mobile
      rightSidebarCollapsed: getInitialSidebarState(), // Collapsed by default on mobile
      setActiveSidebarTab: (tab) => set({ activeSidebarTab: tab }),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setRightSidebarCollapsed: (collapsed) => set({ rightSidebarCollapsed: collapsed }),
    }),
    {
      name: 'ui-storage',
    }
  )
);

