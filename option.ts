/**
 * Option represents a value that may or may not exist.
 */
export type Option<T> = T | null;

/**
 * **some** checks if the Option passed is a non-null value
 * @param value An optional value
 */
export function some<T>(value: Option<T>): value is T {
  return value !== null;
}

/**
 * **none** checks if the Option passed is a null value
 * @param value An optional value
 */
export function none<T>(value: Option<T>): value is null {
  return value === null;
}
