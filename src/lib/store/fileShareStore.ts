import { create } from 'zustand';
import { filesApi, type FileShareUsage, type SharedFile } from '@/services/apiService';

function emptyUsage(): Omit<FileShareUsage, 'files'> {
  return { usedBytes: 0, quotaBytes: 0, remainingBytes: 0 };
}

interface FileShareState {
  files: SharedFile[];
  usedBytes: number;
  quotaBytes: number;
  remainingBytes: number;
  isLoading: boolean;
  isUploading: boolean;
  hasLoaded: boolean;
  error: string | null;
  load: () => Promise<void>;
  upload: (file: File) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

function applyUsage(
  payload: Omit<FileShareUsage, 'files'> & { files?: SharedFile[] },
  currentFiles: SharedFile[],
): Pick<FileShareState, 'files' | 'usedBytes' | 'quotaBytes' | 'remainingBytes'> {
  return {
    files: payload.files ?? currentFiles,
    usedBytes: payload.usedBytes,
    quotaBytes: payload.quotaBytes,
    remainingBytes: payload.remainingBytes,
  };
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const digits = unit === 0 || Number.isInteger(value) ? 0 : 1;
  return `${value.toFixed(digits)} ${units[unit]}`;
}

export function canUploadFile(file: File, remainingBytes: number): string | null {
  if (file.size <= 0) return 'Empty files are not stored.';
  if (file.size > remainingBytes) {
    return `${file.name} is ${formatBytes(file.size)}, but only ${formatBytes(remainingBytes)} remains.`;
  }
  return null;
}

export const useFileShareStore = create<FileShareState>()((set, get) => ({
  files: [],
  ...emptyUsage(),
  isLoading: false,
  isUploading: false,
  hasLoaded: false,
  error: null,

  load: async () => {
    if (get().isLoading) return;
    set({ isLoading: true, error: null });
    try {
      const payload = await filesApi.list();
      set({ ...applyUsage(payload, payload.files), isLoading: false, hasLoaded: true });
    } catch (error) {
      console.error('Error loading shared files:', error);
      set({
        isLoading: false,
        hasLoaded: true,
        error: error instanceof Error ? error.message : 'Failed to load files',
      });
    }
  },

  upload: async (file) => {
    const blocked = canUploadFile(file, get().remainingBytes);
    if (blocked) {
      set({ error: blocked });
      throw new Error(blocked);
    }
    set({ isUploading: true, error: null });
    try {
      const payload = await filesApi.upload(file);
      set({
        ...applyUsage(payload, [payload.file, ...get().files]),
        isUploading: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to upload file';
      set({ isUploading: false, error: message });
      throw error;
    }
  },

  remove: async (id) => {
    const payload = await filesApi.delete(id);
    set(applyUsage(payload, get().files.filter((file) => file.id !== id)));
  },
}));
