import type { CSSProperties } from 'react';

/**
 * Parses a "prop:value;prop2:value2" CSS string (exactly as authored in the
 * approved design) into a React style object, so inline styles can be
 * ported verbatim instead of hand-converted to camelCase object literals.
 */
export function sx(str?: string | null): CSSProperties | undefined {
  if (!str) return undefined;
  const out: Record<string, string> = {};
  for (const decl of str.split(';')) {
    const i = decl.indexOf(':');
    if (i < 0) continue;
    let prop = decl.slice(0, i).trim();
    const val = decl.slice(i + 1).trim();
    if (!prop || !val) continue;
    if (!prop.startsWith('--')) {
      prop = prop.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
    }
    out[prop] = val;
  }
  return out as CSSProperties;
}
