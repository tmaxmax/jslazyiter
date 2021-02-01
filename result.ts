type Ok<T> = { success: true; value: T };
type Err<E> = { success: false; value: E };
/**
 * **Result** represents either a successful value or an error.
 * An object is of type Result if it has 2 fields: success and value,
 * where success is a boolean that indicates whether the value
 * is successful or an error.
 * 
 * This type resembles Rust's [Result](https://doc.rust-lang.org/std/result/)
 * and it is used 
 * 
 * @example
 * 
 * async function fetchResource(resource: string): Result<number, string> {
 *   try {
 *     const res = await fetch(resource);
 *     const json: { count: number } = await res.json();
 *     return { success: true, value: count };
 *   } catch (e) {
 *     return { success: false, value: e.toString() };
 *   }
 * }
 */
export type Result<T, E> = Ok<T> | Err<E>;
/**
 * **ok** checks if the Result passed is successful
 * @param result A result
 */

export function ok<T, E>(result: Result<T, E>): result is Ok<T> {
  return result.success;
}

/**
 * **err** checks if the Result passed is an error
 * @param result A result
 */
export function err<T, E>(result: Result<T, E>): result is Err<E> {
  return !result.success;
}
