import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SecuritySettings {
  alertsEnabled: boolean;
  notificationsEnabled: boolean;
  autoLockEnabled: boolean;
  lockTimeout: number; // minutes
}

interface SecurityState {
  settings: SecuritySettings;
  updateSettings: (updates: Partial<SecuritySettings>) => void;
}

export const useSecurityStore = create<SecurityState>()(
  persist(
    (set) => ({
      settings: {
        alertsEnabled: true,
        notificationsEnabled: true,
        autoLockEnabled: false,
        lockTimeout: 15,
      },
      updateSettings: (updates) => set((state) => ({
        settings: { ...state.settings, ...updates }
      })),
    }),
    {
      name: 'security-storage',
    }
  )
);

