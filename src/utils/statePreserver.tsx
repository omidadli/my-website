import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
  ReactNode,
} from 'react';

/**
 * StatePreserver: A global utility that guarantees data-heavy components,
 * dashboards, status grids, charts, forms, and interactive widgets retain
 * their active internal states across theme toggles without flicker, reset,
 * or redundant network / computation overhead.
 */

export interface CachedItem<T = unknown> {
  data: T;
  timestamp: number;
  ttl?: number; // Time-to-live in ms (optional)
}

interface StatePreserverContextType {
  // Key-value memory store for component internal states
  getPreservedState: <T>(key: string, defaultValue: T | (() => T)) => T;
  setPreservedState: <T>(key: string, value: T | ((prev: T) => T)) => void;
  removePreservedState: (key: string) => void;
  clearAllPreservedState: () => void;

  // Data cache helper to prevent redundant API fetches on theme switch or component re-render
  getCachedData: <T>(cacheKey: string) => T | null;
  setCachedData: <T>(cacheKey: string, data: T, ttlMs?: number) => void;
  fetchWithCache: <T>(
    cacheKey: string,
    fetcher: () => Promise<T>,
    ttlMs?: number
  ) => Promise<T>;
  
  // Theme transition tracker
  isThemeSwitching: boolean;
}

const StatePreserverContext = createContext<StatePreserverContextType | null>(null);

// Global in-memory cache shared across theme shifts & mounts
const globalMemoryStore = new Map<string, unknown>();
const globalApiCache = new Map<string, CachedItem<unknown>>();

// Optional sessionStorage persistence key prefix
const STORAGE_PREFIX = 'nd_preserver_';

export const StatePreserverProvider: React.FC<{
  children: ReactNode;
  theme?: string;
}> = ({ children, theme }) => {
  const [storeTick, setStoreTick] = useState<number>(0);
  const [isThemeSwitching, setIsThemeSwitching] = useState<boolean>(false);
  const prevThemeRef = useRef<string | undefined>(theme);
  const themeSwitchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Detect theme toggle and trigger smooth preservation state window
  useEffect(() => {
    if (prevThemeRef.current !== undefined && prevThemeRef.current !== theme) {
      setIsThemeSwitching(true);
      if (themeSwitchTimeoutRef.current) {
        clearTimeout(themeSwitchTimeoutRef.current);
      }
      // Keep switching flag active for 450ms (matches CSS token interpolation & transitions)
      themeSwitchTimeoutRef.current = setTimeout(() => {
        setIsThemeSwitching(false);
      }, 450);
    }
    prevThemeRef.current = theme;
  }, [theme]);

  const getPreservedState = useCallback(<T,>(key: string, defaultValue: T | (() => T)): T => {
    if (globalMemoryStore.has(key)) {
      return globalMemoryStore.get(key) as T;
    }
    // Attempt sessionStorage fallback for persistent reload preservation
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        const stored = window.sessionStorage.getItem(`${STORAGE_PREFIX}${key}`);
        if (stored !== null) {
          const parsed = JSON.parse(stored);
          globalMemoryStore.set(key, parsed);
          return parsed as T;
        }
      }
    } catch {
      // sessionStorage unavailable or JSON parse error
    }

    const initial = typeof defaultValue === 'function' ? (defaultValue as () => T)() : defaultValue;
    globalMemoryStore.set(key, initial);
    return initial;
  }, []);

  const setPreservedState = useCallback(<T,>(key: string, valueOrFn: T | ((prev: T) => T)) => {
    const current = globalMemoryStore.get(key) as T;
    const nextVal = typeof valueOrFn === 'function'
      ? (valueOrFn as (prev: T) => T)(current)
      : valueOrFn;

    globalMemoryStore.set(key, nextVal);

    // Sync to sessionStorage safely
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(nextVal));
      }
    } catch {
      // sessionStorage full or quota exceeded
    }

    setStoreTick((t) => t + 1);
  }, []);

  const removePreservedState = useCallback((key: string) => {
    globalMemoryStore.delete(key);
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.removeItem(`${STORAGE_PREFIX}${key}`);
      }
    } catch {
      // ignore
    }
    setStoreTick((t) => t + 1);
  }, []);

  const clearAllPreservedState = useCallback(() => {
    globalMemoryStore.clear();
    globalApiCache.clear();
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        Object.keys(window.sessionStorage).forEach((k) => {
          if (k.startsWith(STORAGE_PREFIX)) {
            window.sessionStorage.removeItem(k);
          }
        });
      }
    } catch {
      // ignore
    }
    setStoreTick((t) => t + 1);
  }, []);

  const getCachedData = useCallback(<T,>(cacheKey: string): T | null => {
    const item = globalApiCache.get(cacheKey) as CachedItem<T> | undefined;
    if (!item) return null;
    if (item.ttl && Date.now() - item.timestamp > item.ttl) {
      globalApiCache.delete(cacheKey);
      return null;
    }
    return item.data;
  }, []);

  const setCachedData = useCallback(<T,>(cacheKey: string, data: T, ttlMs: number = 300000) => {
    globalApiCache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    });
  }, []);

  const fetchWithCache = useCallback(async <T,>(
    cacheKey: string,
    fetcher: () => Promise<T>,
    ttlMs: number = 300000
  ): Promise<T> => {
    const cached = getCachedData<T>(cacheKey);
    if (cached !== null) {
      return cached;
    }
    const fresh = await fetcher();
    setCachedData(cacheKey, fresh, ttlMs);
    return fresh;
  }, [getCachedData, setCachedData]);

  const value = useMemo(
    () => ({
      getPreservedState,
      setPreservedState,
      removePreservedState,
      clearAllPreservedState,
      getCachedData,
      setCachedData,
      fetchWithCache,
      isThemeSwitching,
    }),
    [
      getPreservedState,
      setPreservedState,
      removePreservedState,
      clearAllPreservedState,
      getCachedData,
      setCachedData,
      fetchWithCache,
      isThemeSwitching,
      storeTick,
    ]
  );

  return (
    <StatePreserverContext.Provider value={value}>
      {children}
    </StatePreserverContext.Provider>
  );
};

/**
 * usePreservedState: Drop-in replacement for useState for any component state
 * that should persist across theme toggles, route hops, or re-renders.
 */
export function usePreservedState<T>(
  key: string,
  initialValue: T | (() => T)
): [T, (val: T | ((prev: T) => T)) => void] {
  const context = useContext(StatePreserverContext);
  
  // Local fallback if used outside provider
  const [localVal, setLocalVal] = useState<T>(initialValue);

  if (!context) {
    return [localVal, setLocalVal];
  }

  const { getPreservedState, setPreservedState } = context;
  const state = getPreservedState<T>(key, initialValue);

  const setState = useCallback(
    (action: T | ((prev: T) => T)) => {
      setPreservedState<T>(key, action);
    },
    [key, setPreservedState]
  );

  return [state, setState];
}

/**
 * usePreservedQuery: Prevents refetching API data when toggling themes or re-mounting
 */
export function usePreservedQuery<T>(
  cacheKey: string,
  fetcher: () => Promise<T>,
  options: {
    ttlMs?: number;
    enabled?: boolean;
  } = {}
) {
  const context = useContext(StatePreserverContext);
  const [data, setData] = useState<T | null>(() => context ? context.getCachedData<T>(cacheKey) : null);
  const [loading, setLoading] = useState<boolean>(!data);
  const [error, setError] = useState<Error | null>(null);

  const { ttlMs = 300000, enabled = true } = options;

  useEffect(() => {
    if (!enabled) return;

    let isMounted = true;
    if (context) {
      const cached = context.getCachedData<T>(cacheKey);
      if (cached !== null) {
        setData(cached);
        setLoading(false);
        return;
      }

      setLoading(true);
      context
        .fetchWithCache(cacheKey, fetcher, ttlMs)
        .then((result) => {
          if (isMounted) {
            setData(result);
            setLoading(false);
          }
        })
        .catch((err) => {
          if (isMounted) {
            setError(err);
            setLoading(false);
          }
        });
    } else {
      setLoading(true);
      fetcher()
        .then((res) => {
          if (isMounted) {
            setData(res);
            setLoading(false);
          }
        })
        .catch((err) => {
          if (isMounted) {
            setError(err);
            setLoading(false);
          }
        });
    }

    return () => {
      isMounted = false;
    };
  }, [cacheKey, enabled, ttlMs, context, fetcher]);

  return { data, loading, error };
}

/**
 * useThemeSwitching: Allows components (like canvas / SVG charts) to suppress
 * animation jumps during theme crossfades to prevent visual flickering.
 */
export function useThemeSwitching(): boolean {
  const context = useContext(StatePreserverContext);
  return context?.isThemeSwitching ?? false;
}
