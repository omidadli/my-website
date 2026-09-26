const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

export function safeRecordArray<T>(value: unknown): T[] {
  return Array.isArray(value)
    ? value.filter((item) => isPlainObject(item)) as T[]
    : [];
}

/**
 * Merge an API/local-storage content snapshot with its built-in schema defaults.
 * This protects every route from older or partially corrupted CMS documents
 * (for example, `sections: null` where the UI expects an array) while retaining
 * intentional empty arrays and all custom object keys.
 */
export function mergeContentDefaults<T>(defaults: T, incoming: unknown): T {
  if (Array.isArray(defaults)) {
    return (Array.isArray(incoming) ? incoming : defaults) as T;
  }

  if (isPlainObject(defaults)) {
    if (!isPlainObject(incoming)) return defaults;
    const result: Record<string, unknown> = { ...incoming };
    for (const [key, defaultValue] of Object.entries(defaults)) {
      result[key] = mergeContentDefaults(defaultValue, incoming[key]);
    }
    return result as T;
  }

  if (defaults === null || defaults === undefined) {
    return (incoming ?? defaults) as T;
  }
  if (typeof defaults === 'string') return (typeof incoming === 'string' ? incoming : defaults) as T;
  if (typeof defaults === 'number') return (typeof incoming === 'number' && Number.isFinite(incoming) ? incoming : defaults) as T;
  if (typeof defaults === 'boolean') return (typeof incoming === 'boolean' ? incoming : defaults) as T;
  return (incoming === undefined ? defaults : incoming) as T;
}
