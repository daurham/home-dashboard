import { describe, expect, it } from 'vitest';
import { canUploadFile, formatBytes, isClipboardImage, isCopyableText, isPreviewableImage } from './fileShareStore';

function fakeFile(size: number, name: string) {
  return { size, name } as File;
}

describe('formatBytes', () => {
  it('formats common sizes', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(2048)).toBe('2 KB');
    expect(formatBytes(5 * 1024 * 1024)).toBe('5 MB');
  });
});

describe('canUploadFile', () => {
  it('blocks empty files', () => {
    expect(canUploadFile(fakeFile(0, 'empty.txt'), 1000)).toBe('Empty files are not stored.');
  });

  it('blocks files larger than remaining space', () => {
    expect(canUploadFile(fakeFile(500, 'notes.txt'), 100)).toContain('only 100 B remains');
  });

  it('allows a file that fits', () => {
    expect(canUploadFile(fakeFile(50, 'notes.txt'), 100)).toBeNull();
  });
});

describe('isPreviewableImage', () => {
  it('detects photos by mime type', () => {
    expect(isPreviewableImage({ mimeType: 'image/jpeg', originalName: 'scan.bin' })).toBe(true);
    expect(isPreviewableImage({ mimeType: 'image/heic', originalName: 'IMG_1201.HEIC' })).toBe(true);
  });

  it('falls back to the filename when mime is generic', () => {
    expect(isPreviewableImage({ mimeType: 'application/octet-stream', originalName: 'porch.png' })).toBe(true);
    expect(isPreviewableImage({ mimeType: 'application/pdf', originalName: 'lease.pdf' })).toBe(false);
  });
});

describe('isCopyableText', () => {
  it('treats notes and json as copyable', () => {
    expect(isCopyableText({ mimeType: 'text/plain', originalName: 'wifi.txt', sizeBytes: 80 })).toBe(true);
    expect(isCopyableText({ mimeType: 'application/json', originalName: 'data.json', sizeBytes: 200 })).toBe(true);
    expect(isCopyableText({ mimeType: 'application/octet-stream', originalName: 'codes.md', sizeBytes: 40 })).toBe(true);
  });

  it('skips huge or binary files', () => {
    expect(isCopyableText({ mimeType: 'text/plain', originalName: 'novel.txt', sizeBytes: 2_000_000 })).toBe(false);
    expect(isCopyableText({ mimeType: 'application/pdf', originalName: 'lease.pdf', sizeBytes: 80 })).toBe(false);
  });
});

describe('isClipboardImage', () => {
  it('allows common pasteable photo types', () => {
    expect(isClipboardImage({ mimeType: 'image/png', originalName: 'shot.png' })).toBe(true);
    expect(isClipboardImage({ mimeType: 'image/heic', originalName: 'IMG_1201.HEIC' })).toBe(false);
  });
});
