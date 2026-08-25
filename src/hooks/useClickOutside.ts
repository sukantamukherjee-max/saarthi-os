import { useEffect, useRef } from 'react';

/** Calls onOutside when a mousedown lands outside the returned ref's element — only while active. */
export function useClickOutside<T extends HTMLElement>(active: boolean, onOutside: () => void) {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (!active) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside();
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [active, onOutside]);
  return ref;
}
