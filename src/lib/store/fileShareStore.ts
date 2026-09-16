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

const PREVIEWABLE_IMAGE_MIME = /^(image\/(avif|bmp|gif|heic|heif|jpeg|jpg|pjpeg|png|svg\+xml|webp))$/i;
const PREVIEWABLE_IMAGE_EXT = /\.(avif|bmp|gif|heic|heif|jpe?g|png|svg|webp)$/i;

export function isPreviewableImage(file: { mimeType?: string; originalName?: string }): boolean {
  if (file.mimeType && PREVIEWABLE_IMAGE_MIME.test(file.mimeType)) return true;
  return PREVIEWABLE_IMAGE_EXT.test(file.originalName ?? '');
}

const COPYABLE_TEXT_MIME = /^(text\/|application\/(json|xml|yaml|x-yaml|javascript|sql))/i;
const COPYABLE_TEXT_EXT = /\.(txt|md|csv|json|log|html|xml|ya?ml|js|ts|css|env|ini|conf)$/i;
const TEXT_COPY_LIMIT_BYTES = 1_000_000;
const CLIPBOARD_IMAGE_MIME = /^(image\/(gif|jpeg|jpg|pjpeg|png|webp))$/i;
const CLIPBOARD_IMAGE_EXT = /\.(gif|jpe?g|png|webp)$/i;

export function isCopyableText(file: { mimeType?: string; originalName?: string; sizeBytes?: number }): boolean {
  if ((file.sizeBytes ?? 0) > TEXT_COPY_LIMIT_BYTES) return false;
  if (file.mimeType && COPYABLE_TEXT_MIME.test(file.mimeType)) return true;
  return COPYABLE_TEXT_EXT.test(file.originalName ?? '');
}

export function isClipboardImage(file: { mimeType?: string; originalName?: string }): boolean {
  if (file.mimeType && CLIPBOARD_IMAGE_MIME.test(file.mimeType)) return true;
  return CLIPBOARD_IMAGE_EXT.test(file.originalName ?? '');
}

export function sharedFileUrl(id: string): string {
  const path = filesApi.downloadUrl(id);
  if (typeof window === 'undefined') return path;
  return new URL(path, window.location.href).toString();
}

export async function copySharedFile(file: SharedFile): Promise<'text' | 'image' | 'link'> {
  const url = filesApi.downloadUrl(file.id);
  const link = sharedFileUrl(file.id);

  if (isCopyableText(file)) {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Could not read file');
    await navigator.clipboard.writeText(await response.text());
    return 'text';
  }

  if (isClipboardImage(file) && typeof ClipboardItem !== 'undefined' && navigator.clipboard.write) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Could not read file');
      const blob = await response.blob();
      const type = CLIPBOARD_IMAGE_MIME.test(blob.type) ? blob.type : 'image/png';
      await navigator.clipboard.write([new ClipboardItem({ [type]: blob })]);
      return 'image';
    } catch {
      await navigator.clipboard.writeText(link);
      return 'link';
    }
  }

  await navigator.clipboard.writeText(link);
  return 'link';
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
