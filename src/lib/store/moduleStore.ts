import { create } from 'zustand';
import { getOrCreateModuleInstance, deleteModuleInstanceBySlot, getAllModuleInstances } from '@/services/moduleService';

export type ModuleType = 'weekly-budget-tracker' | 'list-maker' | null;

interface ModuleState {
  modules: [ModuleType, ModuleType]; // Two slots for modules
  isLoading: boolean;
  setModule: (slotIndex: 0 | 1, moduleType: ModuleType) => Promise<void>;
  removeModule: (slotIndex: 0 | 1) => Promise<void>;
  loadModules: () => Promise<void>;
}

// Helper to convert module instance name to ModuleType
function instanceNameToModuleType(name: string): ModuleType {
  if (name === 'weekly-budget-tracker' || name === 'list-maker') {
    return name;
  }
  return null;
}

export const useModuleStore = create<ModuleState>()((set, get) => ({
  modules: [null, null],
  isLoading: false,
  
  loadModules: async () => {
    set({ isLoading: true });
    try {
      // Get all module instances
      const instances = await getAllModuleInstances();
      
      // Map instances to slots based on settings.slotId
      const slotModules: [ModuleType, ModuleType] = [null, null];
      
      instances.forEach((inst: any) => {
        try {
          const settings = typeof inst.settings === 'string' 
            ? JSON.parse(inst.settings) 
            : (inst.settings || {});
          const slotId = settings?.slotId;
          
          // slotId format is typically "slot-0" or "slot-1"
          const slotIndex = slotId ? parseInt(slotId.replace('slot-', '')) : null;
          
          if (slotIndex === 0 || slotIndex === 1) {
            const moduleType = instanceNameToModuleType(inst.module_name || '');
            if (moduleType) {
              slotModules[slotIndex] = moduleType;
            }
          }
        } catch (e) {
          console.error('Error parsing module instance settings:', e);
        }
      });
      
      set({ modules: slotModules, isLoading: false });
    } catch (error) {
      console.error('Error loading modules:', error);
      set({ isLoading: false });
    }
  },
  
  setModule: async (slotIndex, moduleType) => {
    const slotId = `slot-${slotIndex}`;
    
    try {
      if (moduleType) {
        // Create or get module instance
        await getOrCreateModuleInstance(moduleType, slotId);
      } else {
        // Remove module - delete instance
        const currentModule = get().modules[slotIndex];
        if (currentModule) {
          await deleteModuleInstanceBySlot(currentModule, slotId);
        }
      }
      
      // Update local state
      set((state) => {
        const newModules: [ModuleType, ModuleType] = [...state.modules];
        newModules[slotIndex] = moduleType;
        return { modules: newModules };
      });
    } catch (error) {
      console.error('Error setting module:', error);
      throw error;
    }
  },
  
  removeModule: async (slotIndex) => {
    await get().setModule(slotIndex, null);
  },
}));

// Load modules on store creation
useModuleStore.getState().loadModules();
