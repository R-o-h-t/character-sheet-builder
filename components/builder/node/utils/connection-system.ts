/**
 * Enhanced connection-based data flow system
 * Data flows ONLY through connections, each connection point handles separate data
 */

import { Node } from '../../node-registry';

export type ConnectionHandle = {
  id: string;
  label: string;
  type: 'number' | 'boolean' | 'text' | 'any';
  position: 'input' | 'output';
  isConnected: boolean;
  maxConnections?: number; // undefined = unlimited for outputs, 1 for inputs
};

export type ConnectionData = {
  value: unknown;
  sourceNodeId?: string;
  sourceHandleId?: string;
  targetNodeId?: string;
  targetHandleId?: string;
  error?: string;
};

export type NodeConnectionState = {
  inputs: Record<string, ConnectionData | undefined>;
  outputs: Record<string, ConnectionData>;
  inputHandles: ConnectionHandle[];
  outputHandles: ConnectionHandle[];
};

export interface ConnectionValue {
  value: unknown;
  handleId: string;
  sourceNodeId?: string;
  sourceHandleId?: string;
  isConnected: boolean;
  error?: string;
}

/**
 * Get connection data for a specific input handle
 */
export function getInputConnection(
  data: Node['data'],
  handleId: string
): ConnectionValue | undefined {
  const entry = data.entries?.[handleId];
  if (!entry) {
    return {
      value: undefined,
      handleId,
      isConnected: false,
    };
  }

  return {
    value: entry.value,
    handleId,
    sourceNodeId: entry.sourceNodeId,
    sourceHandleId: entry.sourceHandleId,
    isConnected: true,
    error: isErrorValue(entry.value) ? entry.value.error : undefined,
  };
}

/**
 * Get all input connections for a node
 */
export function getAllInputConnections(
  data: Node['data'],
  inputHandles: string[]
): Record<string, ConnectionValue> {
  const connections: Record<string, ConnectionValue> = {};

  for (const handleId of inputHandles) {
    const connection = getInputConnection(data, handleId);
    if (connection) {
      connections[handleId] = connection;
    }
  }

  return connections;
}

/**
 * Check if a value represents an error
 */
export function isErrorValue(value: unknown): value is { error: string } {
  return Boolean(value && typeof value === 'object' && 'error' in value);
}

/**
 * Create an error value
 */
export function createError(message: string): { error: string } {
  return { error: message };
}

/**
 * Format any value for display
 */
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

/**
 * Format value as JSON for complete data display
 */
export function formatValueAsJson(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

/**
 * Convert any value to number
 */
export function toNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
}

/**
 * Convert any value to boolean
 */
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

/**
 * Resolve input value with type checking for numbers
 */
export function resolveNumberInput(
  connection: ConnectionValue | undefined,
  fallbackValue?: number
): number | { error: string } {
  // If not connected and no fallback, return error
  if (!connection?.isConnected) {
    if (fallbackValue !== undefined) {
      return fallbackValue;
    }
    return createError('Number input required');
  }

  // If connected but has error, return the error
  if (connection.error) {
    return createError(connection.error);
  }

  // Try to convert to number
  const num = toNumber(connection.value);
  if (num === null) {
    return createError('Input must be a valid number');
  }

  return num;
}

/**
 * Resolve input value with type checking for booleans
 */
export function resolveBooleanInput(
  connection: ConnectionValue | undefined,
  fallbackValue?: boolean
): boolean | { error: string } {
  if (!connection?.isConnected) {
    if (fallbackValue !== undefined) {
      return fallbackValue;
    }
    return createError('Boolean input required');
  }

  if (connection.error) {
    return createError(connection.error);
  }

  return toBoolean(connection.value);
}

/**
 * Resolve input value for text/any type
 */
export function resolveAnyInput(
  connection: ConnectionValue | undefined,
  fallbackValue?: unknown
): unknown {
  if (!connection?.isConnected) {
    return fallbackValue;
  }

  if (connection.error) {
    return createError(connection.error);
  }

  return connection.value;
}
