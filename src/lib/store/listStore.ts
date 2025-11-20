import { create } from 'zustand';
import { getInstanceIdForSlot, getOrCreateModuleData, updateModuleData } from '@/services/moduleService';

export interface ListItem {
  id: string;
  text: string;
  isChecked: boolean;
  isCheckbox: boolean; // true for checkbox, false for bullet point
  order: number;
}

interface ListData {
  items: ListItem[];
}

interface ListState {
  lists: Record<string, ListData>; // Keyed by slot identifier
  instanceIds: Record<string, string>; // Map slotId to instanceId
  isLoading: Record<string, boolean>;
  addItem: (slotId: string, text: string, isCheckbox?: boolean) => void;
  updateItem: (slotId: string, id: string, updates: Partial<ListItem>) => void;
  removeItem: (slotId: string, id: string) => void;
  toggleItemCheck: (slotId: string, id: string) => void;
  toggleItemType: (slotId: string, id: string) => void;
  reorderItems: (slotId: string, itemIds: string[]) => void;
  clearAllItems: (slotId: string) => void;
  getListData: (slotId: string) => ListData;
  loadListData: (slotId: string) => Promise<void>;
}

const getDefaultListData = (): ListData => ({
  items: [],
});

// Helper to save list data to database
async function saveListToDb(slotId: string, listData: ListData, instanceId: string) {
  try {
    await updateModuleData(instanceId, listData);
  } catch (error) {
    console.error(`Error saving list data for ${slotId}:`, error);
  }
}

export const useListStore = create<ListState>()((set, get) => ({
  lists: {},
  instanceIds: {},
  isLoading: {},
  
  loadListData: async (slotId: string) => {
    // Prevent multiple simultaneous loads
    if (get().isLoading[slotId]) return;
    
    set((state) => ({
      isLoading: { ...state.isLoading, [slotId]: true },
    }));
    
    try {
      // Get or create module instance
      const instanceId = await getInstanceIdForSlot('list-maker', slotId);
      
      // Store instanceId mapping
      set((state) => ({
        instanceIds: { ...state.instanceIds, [slotId]: instanceId },
      }));
      
      // Load data from database
      const dbData = await getOrCreateModuleData(instanceId);
      
      // Convert database data to ListData format
      const listData: ListData = {
        items: dbData.items ?? [],
      };
      
      set((state) => ({
        lists: { ...state.lists, [slotId]: listData },
        isLoading: { ...state.isLoading, [slotId]: false },
      }));
    } catch (error) {
      console.error(`Error loading list data for ${slotId}:`, error);
      // Set default data on error
      set((state) => ({
        lists: { ...state.lists, [slotId]: getDefaultListData() },
        isLoading: { ...state.isLoading, [slotId]: false },
      }));
    }
  },
  
  addItem: (slotId, text, isCheckbox = true) => {
    const state = get();
    const list = state.lists[slotId] || getDefaultListData();
    const maxOrder = list.items.length > 0 
      ? Math.max(...list.items.map(item => item.order))
      : -1;
    
    const newItem: ListItem = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text,
      isChecked: false,
      isCheckbox,
      order: maxOrder + 1,
    };
    
    const updatedList = {
      ...list,
      items: [...list.items, newItem],
    };
    
    set((state) => ({
      lists: { ...state.lists, [slotId]: updatedList },
    }));
    
    // Save to database
    const instanceId = state.instanceIds[slotId];
    if (instanceId) {
      saveListToDb(slotId, updatedList, instanceId);
    } else {
      state.loadListData(slotId).then(() => {
        const newState = get();
        const newInstanceId = newState.instanceIds[slotId];
        if (newInstanceId) {
          saveListToDb(slotId, updatedList, newInstanceId);
        }
      });
    }
  },
  
  updateItem: (slotId, id, updates) => {
    const state = get();
    const list = state.lists[slotId] || getDefaultListData();
    const updatedList = {
      ...list,
      items: list.items.map((item) => (item.id === id ? { ...item, ...updates } : item)),
    };
    
    set((state) => ({
      lists: { ...state.lists, [slotId]: updatedList },
    }));
    
    // Save to database
    const instanceId = state.instanceIds[slotId];
    if (instanceId) {
      saveListToDb(slotId, updatedList, instanceId);
    } else {
      state.loadListData(slotId).then(() => {
        const newState = get();
        const newInstanceId = newState.instanceIds[slotId];
        if (newInstanceId) {
          saveListToDb(slotId, updatedList, newInstanceId);
        }
      });
    }
  },
  
  removeItem: (slotId, id) => {
    const state = get();
    const list = state.lists[slotId] || getDefaultListData();
    const updatedList = {
      ...list,
      items: list.items.filter((item) => item.id !== id),
    };
    
    set((state) => ({
      lists: { ...state.lists, [slotId]: updatedList },
    }));
    
    // Save to database
    const instanceId = state.instanceIds[slotId];
    if (instanceId) {
      saveListToDb(slotId, updatedList, instanceId);
    } else {
      state.loadListData(slotId).then(() => {
        const newState = get();
        const newInstanceId = newState.instanceIds[slotId];
        if (newInstanceId) {
          saveListToDb(slotId, updatedList, newInstanceId);
        }
      });
    }
  },
  
  toggleItemCheck: (slotId, id) => {
    const state = get();
    const list = state.lists[slotId] || getDefaultListData();
    const updatedList = {
      ...list,
      items: list.items.map((item) =>
        item.id === id ? { ...item, isChecked: !item.isChecked } : item
      ),
    };
    
    set((state) => ({
      lists: { ...state.lists, [slotId]: updatedList },
    }));
    
    // Save to database
    const instanceId = state.instanceIds[slotId];
    if (instanceId) {
      saveListToDb(slotId, updatedList, instanceId);
    } else {
      state.loadListData(slotId).then(() => {
        const newState = get();
        const newInstanceId = newState.instanceIds[slotId];
        if (newInstanceId) {
          saveListToDb(slotId, updatedList, newInstanceId);
        }
      });
    }
  },
  
  toggleItemType: (slotId, id) => {
    const state = get();
    const list = state.lists[slotId] || getDefaultListData();
    const updatedList = {
      ...list,
      items: list.items.map((item) =>
        item.id === id ? { ...item, isCheckbox: !item.isCheckbox, isChecked: false } : item
      ),
    };
    
    set((state) => ({
      lists: { ...state.lists, [slotId]: updatedList },
    }));
    
    // Save to database
    const instanceId = state.instanceIds[slotId];
    if (instanceId) {
      saveListToDb(slotId, updatedList, instanceId);
    } else {
      state.loadListData(slotId).then(() => {
        const newState = get();
        const newInstanceId = newState.instanceIds[slotId];
        if (newInstanceId) {
          saveListToDb(slotId, updatedList, newInstanceId);
        }
      });
    }
  },
  
  reorderItems: (slotId, itemIds) => {
    const state = get();
    const list = state.lists[slotId] || getDefaultListData();
    const reorderedItems = itemIds.map((id, index) => {
      const item = list.items.find((i) => i.id === id);
      return item ? { ...item, order: index } : null;
    }).filter((item): item is ListItem => item !== null);
    
    const updatedList = {
      ...list,
      items: reorderedItems,
    };
    
    set((state) => ({
      lists: { ...state.lists, [slotId]: updatedList },
    }));
    
    // Save to database
    const instanceId = state.instanceIds[slotId];
    if (instanceId) {
      saveListToDb(slotId, updatedList, instanceId);
    } else {
      state.loadListData(slotId).then(() => {
        const newState = get();
        const newInstanceId = newState.instanceIds[slotId];
        if (newInstanceId) {
          saveListToDb(slotId, updatedList, newInstanceId);
        }
      });
    }
  },
  
  clearAllItems: (slotId) => {
    const state = get();
    const list = state.lists[slotId] || getDefaultListData();
    const updatedList = {
      ...list,
      items: [],
    };
    
    set((state) => ({
      lists: { ...state.lists, [slotId]: updatedList },
    }));
    
    // Save to database
    const instanceId = state.instanceIds[slotId];
    if (instanceId) {
      saveListToDb(slotId, updatedList, instanceId);
    } else {
      state.loadListData(slotId).then(() => {
        const newState = get();
        const newInstanceId = newState.instanceIds[slotId];
        if (newInstanceId) {
          saveListToDb(slotId, updatedList, newInstanceId);
        }
      });
    }
  },
  
  getListData: (slotId) => {
    const state = get();
    const list = state.lists[slotId];
    
    // If list not loaded, trigger load (but return default for now)
    if (!list && !state.isLoading[slotId]) {
      state.loadListData(slotId);
    }
    
    // Sort by order
    const listData = list || getDefaultListData();
    return {
      ...listData,
      items: [...listData.items].sort((a, b) => a.order - b.order),
    };
  },
}));
