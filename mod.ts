/**
 * Iter is a wrapper over ECMAScript 2015's protocol.
 * Based on the protocol defined next() method, Iter provides
 * various convenience methods for lazy iteration over collections
 * that implement the protocol. 
 * 
 * In other words, any object that implements either Symbol.iterator
 * or a next() method can be wrapped by Iter! An Iter can only be
 * used once: multiple calls to Symbol.iterator return the same
 * underlying Iterator instance.
 * 
 * @example
 * // Simple usage
 * const set = new Set();
 * set.add("a");
 * set.add("b");
 * set.add("c");
 * set.add("c");
 * const iter = new Iter(set);
 * for (const [index, elem] of iter.enumerate()) {
 *   console.log(`${index}: ${elem}`);
 * }
 * 
 * @example
 * // Process a generator
 * function* gen() {
 *   while (true) {
 *     yield Math.random();
 *   }
 * }
 * const rands = [...new Iter(gen).take(5).map(n => n * 100).map(Math.floor)];
 * console.log(rands);
 * // possible output: [ 23, 54, 32, 65, 38 ]
 * 
 * @example
 * // Iter is consumable
 * const iter = new Iter([1, 2, 3, 4]);
 * for (const elem of iter) {
 *   console.log(elem);
 * }
 * for (const elem of iter) {
 *   console.log(elem);
 * }
 * // output:
 * // 1
 * // 2
 * // 3
 * // 4
 * 
 * @template T the type to iterate over
 */
export class Iter<T> implements IterableIterator<T> {
  private readonly iter: Iterator<T>;

  /**
   * Wraps an iterable in an Iter object
   * @param iterable The object to wrap
   */
  constructor(iterable: Iterable<T>);
  /**
   * Wraps an iterator in an Iter object
   * @param iterator The object to wrap
   */
  constructor(iterator: Iterator<T>);
  constructor(iter: Iterator<T> | Iterable<T>) {
    if (Symbol.iterator in iter) {
      this.iter = (iter as Iterable<T>)[Symbol.iterator]();
    } else {
      this.iter = iter as Iterator<T>;
    }
  }

  [Symbol.iterator]() {
    return this;
  }

  /**
   * **next** advances the iterator, returning the next element
   * and a done flag that indicates if the iteration ended
   * 
   * @example
   * const it = new Iter([1, 2, 3]);
   * const { value, done } = it.next();
   * // value === 1, done == false
   */
  next(): IteratorResult<T> {
    return this.iter.next();
  }

  /**
   * **enumerate** creates an iterator which gives the current
   * iteration count as well as the next value.
   * The returned iterator yields tuples of a number and
   * a value, where the number is the current index of the
   * iteration and the value is the value returned by the
   * iterator.
   */
  enumerate(): Iter<[number, T]> {
    let index = 0;
    const iter = this.iter;

    return new Iter({
      next() {
        const { value, done } = iter.next();
        return { value: [index++, value], done };
      },
    });
  }

  /**
   * **fold** applies a function to each element, returning
   * a single value and consuming the iterator.
   * 
   * It is also called **reduce** or **inject**.
   * 
   * @example
   * const set = new Set(["doorknob", "cappucino", "cappucino", "pianissimo", "baz", "abdicate"]);
   * const word = new Iter(set).fold('', (acc, w) => acc + w.slice(-1));
   * console.log(word); // booze
   * 
   * @param init The accumulator's initial value.
   * @param f Function that takes as arguments the
   * accumulator's value and the current value iterated
   * over and returns the new accumulator value.
   * @returns the final accumulator value
   */
  fold<U>(init: U, f: (acc: U, v: T) => U): U {
    for (
      let { value, done } = this.next();
      !done;
      ({ value, done } = this.next())
    ) {
      init = f(init, value);
    }
    return init;
  }

  /**
   * **fold1** is the same as **fold**, but uses the first
   * element as the initial value for the accumulator.
   * If the iterator is empty, it returns null, else the
   * result of the fold
   * 
   * @param f
   */
  fold1(f: (acc: T, v: T) => T): Option<T> {
    const { value, done } = this.next();
    if (done) {
      return null;
    }
    return this.fold(value, f);
  }

  /**
   * **count** counts the elements in the iterator by calling
   * **next** repeatedly until the iterator is consumed.
   * 
   * @returns the number of elements in the iterator
   */
  count(): number {
    return this.fold(0, (acc) => acc + 1);
  }

  /**
   * **forEach** calls the provided function for each element in
   * the iterator, consuming it.
   * 
   * @param f The function to call
   */
  forEach(f: (value: T) => void): void {
    this.fold<void>(undefined, (_, value) => f(value));
  }

  /**
   * @returns the last element in the iterator, if any, consuming
   * the iterator.
   */
  last(): Option<T> {
    return this.fold<Option<T>>(null, (_, v) => v);
  }
}

type Option<T> = T | null;
