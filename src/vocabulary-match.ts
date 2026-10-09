/** Plain-text matching only: never consumes HTML or TeX. Long aliases win. */
export type VocabularyAlias = { id: string; aliases: string[] };
export type VocabularySegment = { text: string; id?: string };

const escapePattern = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const wordCharacter = /[\p{L}\p{M}\p{N}_]/u;

export function splitVocabulary(text: string, entries: VocabularyAlias[]): VocabularySegment[] {
  const ids = new Map<string, string>();
  for (const entry of entries) for (const alias of entry.aliases) {
    const normalized = alias.trim();
    if (normalized && !ids.has(normalized.toLocaleLowerCase())) ids.set(normalized.toLocaleLowerCase(), entry.id);
  }
  const aliases = [...ids.keys()].sort((a, b) => b.length - a.length);
  if (!aliases.length || !text) return [{ text }];
  const pattern = new RegExp(aliases.map(escapePattern).join('|'), 'giu');
  const segments: VocabularySegment[] = [];
  let cursor = 0;
  for (const match of text.matchAll(pattern)) {
    const start = match.index;
    const end = start + match[0].length;
    const previous = [...text.slice(0, start)].at(-1);
    const next = [...text.slice(end)].at(0);
    // Not JS \b: that splits accented words. "set" must not match "reset".
    if ((previous && wordCharacter.test(previous)) || (next && wordCharacter.test(next))) continue;
    if (start > cursor) segments.push({ text: text.slice(cursor, start) });
    segments.push({ text: match[0], id: ids.get(match[0].toLocaleLowerCase()) });
    cursor = end;
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor) });
  return segments.length ? segments : [{ text }];
}
