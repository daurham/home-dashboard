import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ModuleType = 'weekly-budget-tracker' | 'list-maker' | null;

interface ModuleState {
  modules: [ModuleType, ModuleType]; // Two slots for modules
  setModule: (slotIndex: 0 | 1, moduleType: ModuleType) => void;
  removeModule: (slotIndex: 0 | 1) => void;
}

export const useModuleStore = create<ModuleState>()(
  persist(
    (set) => ({
      // Default: both slots have the weekly budget tracker
      modules: ['weekly-budget-tracker', 'weekly-budget-tracker'],
      setModule: (slotIndex, moduleType) =>
        set((state) => {
          const newModules: [ModuleType, ModuleType] = [...state.modules];
          newModules[slotIndex] = moduleType;
          return { modules: newModules };
        }),
      removeModule: (slotIndex) =>
        set((state) => {
          const newModules: [ModuleType, ModuleType] = [...state.modules];
          newModules[slotIndex] = null;
          return { modules: newModules };
        }),
    }),
    {
      name: 'module-storage',
    }
  )
);

