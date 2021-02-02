import type { Option } from "./option.ts";

export function parseIntegral(s: string): Option<number> {
  const num = parseInt(s);
  if (Number.isNaN(num)) {
    return null;
  }
  return num;
}

export function cmpNumbers(lhs: number, rhs: number): Option<number> {
  if (Number.isNaN(lhs) || Number.isNaN(rhs)) {
    return null;
  }
  return lhs - rhs;
}

/**
 * **range** returns a generator that yields numbers from 0 to len - 1.
 * Pass `true` as the next argument to get an inclusive range.
 * 
 * @param len The number of elements to generate.
 */
export function range(len: number): IterableIterator<number>;
export function range(stop: number, inclusive: true): IterableIterator<number>;
/**
 * **range** returns a generator that yields numbers from start to stop - 1.
 * Pass `true` as the next argument to get an inclusive range.
 * 
 * @param start The number to start from.
 * @param stop The number to end before.
 */
export function range(start: number, stop: number): IterableIterator<number>;
/**
 * **range** returns a generator that yields numbers from start to stop.
 *  
 * @param start The number to start from.
 * @param stop The number to end at.
 */
export function range(
  start: number,
  stop: number,
  inclusive: true,
): IterableIterator<number>;
/**
 * **range** returns a generator that yields numbers in range [start, stop),
 * iterating with the given step.
 * Pass `true` as the next argument to get an inclusive range.
 * 
 * @param start The number to start at.
 * @param stop The number to end before.
 * @param step The iteration step.
 */
export function range(
  start: number,
  stop: number,
  step: number,
): IterableIterator<number>;
/**
 * **range** returns a generator that yields numbers in range [start, stop],
 * iterating with the given step.
 *
 * @param start The number to start at.
 * @param stop The number to end at.
 * @param step The iteration step.
 */
export function range(
  start: number,
  stop: number,
  step: number,
  inclusive: true,
): IterableIterator<number>;
export function* range(
  a: number,
  b?: number | true,
  c?: number | true,
  d?: true,
): IterableIterator<number> {
  const [begin, end, step] = (() => {
    if (typeof b === "boolean") {
      return [0, a + 1, 1];
    }
    if (typeof b === "number") {
      if (typeof c === "boolean") {
        return [a, b + 1, 1];
      }
      if (typeof c === "number") {
        if (typeof d === "boolean") {
          return [a, b + 1, c];
        }
        return [a, b, c];
      }
      return [a, b, 1];
    }
    return [0, a, 1];
  })();

  if (begin > end) {
    throw new Error(`Invalid range: begin ${begin} is greater than end ${end}`);
  }

  let i = begin;
  while (i < end) {
    yield i;
    i += step;
  }
}
