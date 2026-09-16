import { create } from 'zustand';
import { logsApi, type LogBook } from '@/services/apiService';

interface LogState {
  books: LogBook[];
  activeBookId: string | null;
  isLoading: boolean;
  isSaving: boolean;
  hasLoaded: boolean;
  error: string | null;
  loadBooks: () => Promise<void>;
  selectBook: (id: string) => void;
  addBook: (name: string) => Promise<LogBook>;
  renameBook: (id: string, name: string) => Promise<void>;
  saveBody: (id: string, body: string) => Promise<void>;
  removeBook: (id: string) => Promise<void>;
}

export const useLogStore = create<LogState>()((set, get) => ({
  books: [],
  activeBookId: null,
  isLoading: false,
  isSaving: false,
  hasLoaded: false,
  error: null,

  loadBooks: async () => {
    if (get().isLoading) return;
    set({ isLoading: true, error: null });
    try {
      const books = await logsApi.listBooks();
      const preferred =
        books.find((book) => book.id === get().activeBookId)
        || books.find((book) => book.slug === 'maintenance')
        || books[0]
        || null;
      set({
        books,
        activeBookId: preferred?.id ?? null,
        isLoading: false,
        hasLoaded: true,
      });
    } catch (error) {
      console.error('Error loading logs:', error);
      set({
        isLoading: false,
        hasLoaded: true,
        error: error instanceof Error ? error.message : 'Failed to load logs',
      });
    }
  },

  selectBook: (id) => {
    set({ activeBookId: id, error: null });
  },

  addBook: async (name) => {
    const created = await logsApi.createBook(name);
    set({ books: [...get().books, created], activeBookId: created.id });
    return created;
  },

  renameBook: async (id, name) => {
    const saved = await logsApi.updateBook(id, { name });
    set({ books: get().books.map((book) => (book.id === id ? saved : book)) });
  },

  saveBody: async (id, body) => {
    set({ isSaving: true, error: null });
    try {
      const saved = await logsApi.updateBook(id, { body });
      set({
        books: get().books.map((book) => (book.id === id ? { ...book, ...saved } : book)),
        isSaving: false,
      });
    } catch (error) {
      console.error('Error saving log:', error);
      set({
        isSaving: false,
        error: error instanceof Error ? error.message : 'Failed to save log',
      });
      throw error;
    }
  },

  removeBook: async (id) => {
    await logsApi.deleteBook(id);
    const books = get().books.filter((book) => book.id !== id);
    const next = books[0] ?? null;
    set({ books, activeBookId: next?.id ?? null });
  },
}));
