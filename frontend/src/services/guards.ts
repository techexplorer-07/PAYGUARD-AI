/** Small runtime type guards shared by the API response parsers. */

export type UnknownRecord = Record<string, unknown>;

export const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
export const isString = (value: unknown): value is string => typeof value === 'string';
export const isNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
export const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean';
export const isNullable = <T>(guard: (v: unknown) => v is T) => (value: unknown): value is T | null =>
  value === null || value === undefined || guard(value);
export const isStringArray = (value: unknown): value is string[] => Array.isArray(value) && value.every(isString);
export const isArrayOf = <T>(guard: (v: unknown) => v is T) => (value: unknown): value is T[] =>
  Array.isArray(value) && value.every(guard);
export const isDecimal = (value: unknown): value is string | number =>
  isNumber(value) || (isString(value) && value.trim() !== '' && Number.isFinite(Number(value)));
export const isRecordOf = <T>(guard: (v: unknown) => v is T) => (value: unknown): value is Record<string, T> =>
  isRecord(value) && Object.values(value).every(guard);

export function hasFields(value: unknown, checks: Record<string, (v: unknown) => boolean>): value is UnknownRecord {
  if (!isRecord(value)) return false;
  return Object.entries(checks).every(([key, check]) => check(value[key]));
}
