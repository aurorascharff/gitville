'use client';

// Houses whose AI room the visitor has already generated, so re-entering can
// default the toggle back on and reuse the cached spec instead of a plain room.
const KEY = 'gv:ai-rooms';

function read(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    return new Set(JSON.parse(localStorage.getItem(KEY) ?? '[]') as string[]);
  } catch {
    return new Set();
  }
}

function write(set: Set<string>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEY, JSON.stringify([...set]));
  } catch {
    // storage full or blocked; sticky-AI just won't persist.
  }
}

export function hasAiRoom(slug: string, cellId: string): boolean {
  return read().has(`${slug}:${cellId}`);
}

export function rememberAiRoom(slug: string, cellId: string): void {
  const set = read();
  set.add(`${slug}:${cellId}`);
  write(set);
}

export function forgetAiRoom(slug: string, cellId: string): void {
  const set = read();
  set.delete(`${slug}:${cellId}`);
  write(set);
}
