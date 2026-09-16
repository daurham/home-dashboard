/** Growing household log document helpers. */

export function formatLogDateStamp(timeZone: string, date = new Date()): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function prependDatedBlock(doc: string, stamp: string, note: string): string {
  const trimmedNote = note.replace(/\s+$/, '').replace(/^\s+/, '');
  const block = trimmedNote ? `${stamp}\n${trimmedNote}` : stamp;
  const rest = doc.replace(/^\s+/, '').replace(/\s+$/, '');
  return rest ? `${block}\n\n${rest}\n` : `${block}\n`;
}

export function insertDateAt(
  doc: string,
  index: number,
  stamp: string,
): { text: string; caret: number } {
  const safeIndex = Math.max(0, Math.min(index, doc.length));
  const before = doc.slice(0, safeIndex);
  const after = doc.slice(safeIndex);
  let insert = `${stamp}\n`;
  if (before && !before.endsWith('\n')) insert = `\n\n${insert}`;
  else if (before.endsWith('\n') && !before.endsWith('\n\n')) insert = `\n${insert}`;
  return { text: before + insert + after, caret: before.length + insert.length };
}
