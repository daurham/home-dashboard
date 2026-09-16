import { describe, expect, it } from 'vitest';
import { canUploadFile, formatBytes } from './fileShareStore';

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
