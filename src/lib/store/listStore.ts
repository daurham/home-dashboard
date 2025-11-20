import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
  addItem: (slotId: string, text: string, isCheckbox?: boolean) => void;
  updateItem: (slotId: string, id: string, updates: Partial<ListItem>) => void;
  removeItem: (slotId: string, id: string) => void;
  toggleItemCheck: (slotId: string, id: string) => void;
  toggleItemType: (slotId: string, id: string) => void;
  reorderItems: (slotId: string, itemIds: string[]) => void;
  clearAllItems: (slotId: string) => void;
  getListData: (slotId: string) => ListData;
}

const getDefaultListData = (): ListData => ({
  items: [],
});

export const useListStore = create<ListState>()(
  persist(
    (set, get) => ({
      lists: {},
      addItem: (slotId, text, isCheckbox = true) => {
        const list = get().getListData(slotId);
        const maxOrder = list.items.length > 0 
          ? Math.max(...list.items.map(item => item.order))
          : -1;
        
        set((state) => {
          const currentList = state.lists[slotId] || getDefaultListData();
          return {
            lists: {
              ...state.lists,
              [slotId]: {
                ...currentList,
                items: [
                  ...currentList.items,
                  {
                    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    text,
                    isChecked: false,
                    isCheckbox,
                    order: maxOrder + 1,
                  },
                ],
              },
            },
          };
        });
      },
      updateItem: (slotId, id, updates) => {
        set((state) => {
          const list = state.lists[slotId] || getDefaultListData();
          return {
            lists: {
              ...state.lists,
              [slotId]: {
                ...list,
                items: list.items.map((item) => (item.id === id ? { ...item, ...updates } : item)),
              },
            },
          };
        });
      },
      removeItem: (slotId, id) => {
        set((state) => {
          const list = state.lists[slotId] || getDefaultListData();
          return {
            lists: {
              ...state.lists,
              [slotId]: {
                ...list,
                items: list.items.filter((item) => item.id !== id),
              },
            },
          };
        });
      },
      toggleItemCheck: (slotId, id) => {
        set((state) => {
          const list = state.lists[slotId] || getDefaultListData();
          return {
            lists: {
              ...state.lists,
              [slotId]: {
                ...list,
                items: list.items.map((item) =>
                  item.id === id ? { ...item, isChecked: !item.isChecked } : item
                ),
              },
            },
          };
        });
      },
      toggleItemType: (slotId, id) => {
        set((state) => {
          const list = state.lists[slotId] || getDefaultListData();
          return {
            lists: {
              ...state.lists,
              [slotId]: {
                ...list,
                items: list.items.map((item) =>
                  item.id === id ? { ...item, isCheckbox: !item.isCheckbox, isChecked: false } : item
                ),
              },
            },
          };
        });
      },
      reorderItems: (slotId, itemIds) => {
        set((state) => {
          const list = state.lists[slotId] || getDefaultListData();
          const reorderedItems = itemIds.map((id, index) => {
            const item = list.items.find((i) => i.id === id);
            return item ? { ...item, order: index } : null;
          }).filter((item): item is ListItem => item !== null);
          
          return {
            lists: {
              ...state.lists,
              [slotId]: {
                ...list,
                items: reorderedItems,
              },
            },
          };
        });
      },
      clearAllItems: (slotId) => {
        set((state) => {
          const list = state.lists[slotId] || getDefaultListData();
          return {
            lists: {
              ...state.lists,
              [slotId]: {
                ...list,
                items: [],
              },
            },
          };
        });
      },
      getListData: (slotId) => {
        const state = get();
        const list = state.lists[slotId] || getDefaultListData();
        // Sort by order
        return {
          ...list,
          items: [...list.items].sort((a, b) => a.order - b.order),
        };
      },
    }),
    {
      name: 'list-storage',
    }
  )
);

