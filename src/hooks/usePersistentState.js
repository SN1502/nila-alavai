import { useCallback, useState } from 'react';

function read(key, fallback, validate) {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw == null) return fallback;
    const value = JSON.parse(raw);
    return validate && !validate(value) ? fallback : value;
  } catch {
    return fallback;
  }
}

/**
 * useState that remembers its value in this browser. Storage can be missing
 * or blocked (private windows, embedded previews), so every access is guarded
 * and the app works the same without it.
 */
export function usePersistentState(key, fallback, validate) {
  const [value, setValue] = useState(() => read(key, fallback, validate));

  const update = useCallback(
    (next) => {
      setValue((prev) => {
        const resolved = typeof next === 'function' ? next(prev) : next;
        try {
          window.localStorage.setItem(key, JSON.stringify(resolved));
        } catch {
          /* storage unavailable: keep in memory only */
        }
        return resolved;
      });
    },
    [key],
  );

  return [value, update];
}
