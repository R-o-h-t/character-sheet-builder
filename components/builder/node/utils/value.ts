import { Node } from '../../node-registry';

export type NodeEntries = Node['data']['entries'];

export interface EntryValue {
  value: unknown;
  handleId: string;
  sourceNodeId?: string;
  sourceHandleId?: string;
  sourceRef?: string;
}

export function getEntryByHandle(entries: NodeEntries, handleId: string): EntryValue | undefined {
  if (!entries) {
    return undefined;
  }
  const entry = entries[handleId];
  if (!entry) {
    return undefined;
  }
  return entry;
}

export function isErrorValue(value: unknown): value is { error: string } {
  return Boolean(value && typeof value === 'object' && 'error' in value);
}

export function createError(message: string): { error: string } {
  return { error: message };
}

export function formatValue(value: unknown): string {
  if (isErrorValue(value)) {
    return `Error: ${value.error}`;
  }
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return `Array(${value.length})`;
  if (typeof value === 'object') return 'Object';
  return String(value);
}

export function toBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === 'object') {
    if (isErrorValue(value)) return false;
    return Object.keys(value).length > 0;
  }
  return false;
}

export function parseBoolean(value: unknown): boolean | null {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'y'].includes(normalized)) {
      return true;
    }
    if (['false', '0', 'no', 'n'].includes(normalized)) {
      return false;
    }
  }

  return null;
}

export function toNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }
    const parsed = Number(trimmed);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
}

export function resolveNumber(
  entry: EntryValue | undefined,
  label: string,
  fallback?: number | null
): number | { error: string } {
  if (!entry) {
    if (fallback === null || fallback === undefined) {
      return { error: `Input "${label}" requires a numeric value` };
    }
    return fallback;
  }

  if (isErrorValue(entry.value)) {
    return entry.value;
  }

  const numeric = toNumber(entry.value);
  if (numeric === null) {
    return { error: `Input "${label}" must be numeric` };
  }

  return numeric;
}

export function resolveBoolean(
  entry: EntryValue | undefined,
  label: string,
  fallback?: boolean | null
): boolean | { error: string } {
  if (!entry) {
    if (fallback === null || fallback === undefined) {
      return { error: `Input "${label}" requires a boolean value` };
    }
    return fallback;
  }

  if (isErrorValue(entry.value)) {
    return entry.value;
  }

  const parsed = parseBoolean(entry.value);
  if (parsed === null) {
    return toBoolean(entry.value);
  }
  return parsed;
}
