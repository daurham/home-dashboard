import { create } from 'zustand';
import { getInstanceIdForSlot, getOrCreateModuleData, updateModuleData } from '@/services/moduleService';

export interface Purchase {
  id: string;
  description: string;
  amount: number;
  date: string; // ISO date string
}

interface BudgetData {
  weeklyBudget: number;
  purchases: Purchase[];
}

interface BudgetState {
  budgets: Record<string, BudgetData>; // Keyed by slot identifier
  instanceIds: Record<string, string>; // Map slotId to instanceId
  isLoading: Record<string, boolean>;
  setWeeklyBudget: (slotId: string, amount: number) => void;
  addPurchase: (slotId: string, purchase: Omit<Purchase, 'id'>) => void;
  updatePurchase: (slotId: string, id: string, updates: Partial<Purchase>) => void;
  removePurchase: (slotId: string, id: string) => void;
  clearAllPurchases: (slotId: string) => void;
  getRemainingBudget: (slotId: string) => number;
  getTotalSpent: (slotId: string) => number;
  getBudgetData: (slotId: string) => BudgetData;
  loadBudgetData: (slotId: string) => Promise<void>;
}

const getDefaultBudgetData = (): BudgetData => ({
  weeklyBudget: 500,
  purchases: [],
});

// Helper to save budget data to database
async function saveBudgetToDb(slotId: string, budgetData: BudgetData, instanceId: string) {
  try {
    await updateModuleData(instanceId, budgetData);
  } catch (error) {
    console.error(`Error saving budget data for ${slotId}:`, error);
  }
}

export const useBudgetStore = create<BudgetState>()((set, get) => ({
  budgets: {},
  instanceIds: {},
  isLoading: {},
  
  loadBudgetData: async (slotId: string) => {
    // Prevent multiple simultaneous loads
    if (get().isLoading[slotId]) return;
    
    set((state) => ({
      isLoading: { ...state.isLoading, [slotId]: true },
    }));
    
    try {
      // Get or create module instance
      const instanceId = await getInstanceIdForSlot('weekly-budget-tracker', slotId);
      
      // Store instanceId mapping
      set((state) => ({
        instanceIds: { ...state.instanceIds, [slotId]: instanceId },
      }));
      
      // Load data from database
      const dbData = await getOrCreateModuleData(instanceId);
      
      // Convert database data to BudgetData format
      const budgetData: BudgetData = {
        weeklyBudget: dbData.weeklyBudget ?? 500,
        purchases: dbData.purchases ?? [],
      };
      
      set((state) => ({
        budgets: { ...state.budgets, [slotId]: budgetData },
        isLoading: { ...state.isLoading, [slotId]: false },
      }));
    } catch (error) {
      console.error(`Error loading budget data for ${slotId}:`, error);
      // Set default data on error
      set((state) => ({
        budgets: { ...state.budgets, [slotId]: getDefaultBudgetData() },
        isLoading: { ...state.isLoading, [slotId]: false },
      }));
    }
  },
  
  setWeeklyBudget: (slotId, amount) => {
    const state = get();
    const budget = state.budgets[slotId] || getDefaultBudgetData();
    const updatedBudget = { ...budget, weeklyBudget: amount };
    
    set((state) => ({
      budgets: { ...state.budgets, [slotId]: updatedBudget },
    }));
    
    // Save to database asynchronously
    const instanceId = state.instanceIds[slotId];
    if (instanceId) {
      saveBudgetToDb(slotId, updatedBudget, instanceId);
    } else {
      // Load first if instanceId not available
      state.loadBudgetData(slotId).then(() => {
        const newState = get();
        const newInstanceId = newState.instanceIds[slotId];
        if (newInstanceId) {
          saveBudgetToDb(slotId, updatedBudget, newInstanceId);
        }
      });
    }
  },
  
  addPurchase: (slotId, purchase) => {
    const state = get();
    const budget = state.budgets[slotId] || getDefaultBudgetData();
    const newPurchase: Purchase = {
      ...purchase,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    const updatedBudget = {
      ...budget,
      purchases: [...budget.purchases, newPurchase],
    };
    
    set((state) => ({
      budgets: { ...state.budgets, [slotId]: updatedBudget },
    }));
    
    // Save to database
    const instanceId = state.instanceIds[slotId];
    if (instanceId) {
      saveBudgetToDb(slotId, updatedBudget, instanceId);
    } else {
      state.loadBudgetData(slotId).then(() => {
        const newState = get();
        const newInstanceId = newState.instanceIds[slotId];
        if (newInstanceId) {
          saveBudgetToDb(slotId, updatedBudget, newInstanceId);
        }
      });
    }
  },
  
  updatePurchase: (slotId, id, updates) => {
    const state = get();
    const budget = state.budgets[slotId] || getDefaultBudgetData();
    const updatedBudget = {
      ...budget,
      purchases: budget.purchases.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    };
    
    set((state) => ({
      budgets: { ...state.budgets, [slotId]: updatedBudget },
    }));
    
    // Save to database
    const instanceId = state.instanceIds[slotId];
    if (instanceId) {
      saveBudgetToDb(slotId, updatedBudget, instanceId);
    } else {
      state.loadBudgetData(slotId).then(() => {
        const newState = get();
        const newInstanceId = newState.instanceIds[slotId];
        if (newInstanceId) {
          saveBudgetToDb(slotId, updatedBudget, newInstanceId);
        }
      });
    }
  },
  
  removePurchase: (slotId, id) => {
    const state = get();
    const budget = state.budgets[slotId] || getDefaultBudgetData();
    const updatedBudget = {
      ...budget,
      purchases: budget.purchases.filter((p) => p.id !== id),
    };
    
    set((state) => ({
      budgets: { ...state.budgets, [slotId]: updatedBudget },
    }));
    
    // Save to database
    const instanceId = state.instanceIds[slotId];
    if (instanceId) {
      saveBudgetToDb(slotId, updatedBudget, instanceId);
    } else {
      state.loadBudgetData(slotId).then(() => {
        const newState = get();
        const newInstanceId = newState.instanceIds[slotId];
        if (newInstanceId) {
          saveBudgetToDb(slotId, updatedBudget, newInstanceId);
        }
      });
    }
  },
  
  clearAllPurchases: (slotId) => {
    const state = get();
    const budget = state.budgets[slotId] || getDefaultBudgetData();
    const updatedBudget = {
      ...budget,
      purchases: [],
    };
    
    set((state) => ({
      budgets: { ...state.budgets, [slotId]: updatedBudget },
    }));
    
    // Save to database
    const instanceId = state.instanceIds[slotId];
    if (instanceId) {
      saveBudgetToDb(slotId, updatedBudget, instanceId);
    } else {
      state.loadBudgetData(slotId).then(() => {
        const newState = get();
        const newInstanceId = newState.instanceIds[slotId];
        if (newInstanceId) {
          saveBudgetToDb(slotId, updatedBudget, newInstanceId);
        }
      });
    }
  },
  
  getRemainingBudget: (slotId) => {
    const state = get();
    const budget = state.budgets[slotId] || getDefaultBudgetData();
    return budget.weeklyBudget - budget.purchases.reduce((sum, p) => sum + p.amount, 0);
  },
  
  getTotalSpent: (slotId) => {
    const state = get();
    const budget = state.budgets[slotId] || getDefaultBudgetData();
    return budget.purchases.reduce((sum, p) => sum + p.amount, 0);
  },
  
  getBudgetData: (slotId) => {
    const state = get();
    const budget = state.budgets[slotId];
    
    // If budget not loaded, trigger load (but return default for now)
    if (!budget && !state.isLoading[slotId]) {
      state.loadBudgetData(slotId);
    }
    
    return budget || getDefaultBudgetData();
  },
}));
