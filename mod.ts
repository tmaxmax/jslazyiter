import { Option, some } from "./option.ts";
import { ok, Result } from "./result.ts";

/**
 * **IntoIter** is the type that a value must satisfy to
 * be turned into an Iter
 */
type IntoIter<T> = Iterable<T> | Iterator<T>;

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
export default class Iter<T> implements IterableIterator<T> {
  private readonly iter: Iterator<T>;

  /**
   * Wraps any object that is an iterable or an iterator in
   * an Iter object
   * @param iter The object to wrap
   */
  constructor(iter: IntoIter<T>) {
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
   * let { value, done } = it.next(); // value === 1, done == false
   * ({ value, done } = it.next());   // value === 2, done == false
   * ({ value, done } = it.next());   // value === 3, done == false
   * ({ value, done } = it.next());   // typeof value === "undefined", done === true
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

  /**
   * **tryFold** applies the function as long as it returns successfully,
   * producing a final, single value. Check Result's documentation to see
   * how to use it.
   * 
   * This function works the same as **fold**, except that it short-circuits
   * when an error occurs. If all the function calls succeed, the final value
   * of the accumulator is returned, else the first error that occured is.
   * 
   * @example
   * const sum = new Iter(stringArray).tryFold(0, (acc, v) => {
   *   const num = parseInt(v, 10);
   *   if (Number.isNaN(num)) {
   *     return { success: false };
   *   }
   *   return { success: true, value: acc + num };
   * })
   * // see ok documentation
   * if (ok(sum)) {
   *   console.log(sum.value);
   * } else {
   *   console.log("A string was not a number!");
   * }
   * 
   * @param init The inital value of the accumulator
   * @param f The function to be applied
   * @returns The final value of the accumulator, if the function succeeds,
   * else the first error that occured
   */
  tryFold<U, E>(init: U, f: (acc: U, v: T) => Result<U, E>): Result<U, E> {
    for (
      let { value: v, done } = this.next();
      !done;
      ({ value: v, done } = this.next())
    ) {
      const res = f(init, v);
      if (ok(res)) {
        init = res.value;
      } else {
        return res;
      }
    }
    return { success: true, value: init };
  }

  /**
   * **tryForEach** consumes the iterator, applying the provided function
   * to each element. If the function returns unsuccessfully, the iteration
   * stops and the error is returned.
   * 
   * @param f The function to call
   * @returns nothing, if the calls to the function succeeded on all elements,
   * else the first error that occurred.
   */
  tryForEach<E>(f: (v: T) => Result<void, E>): Result<void, E> {
    return this.tryFold<void, E>(undefined, (_, v) => f(v));
  }

  /**
   * **find** finds the first element in the iterator that satisfies the
   * given predicate, consuming all the previous elements.
   * 
   * @param p The predicate to be satisfied
   * @returns The first element satisfying the predicate, if any
   */
  find(p: (v: T) => boolean): Option<T> {
    return this.tryFold<null, T>(null, (_, value) => {
      if (p(value)) {
        return { success: false, value };
      }
      return { success: true, value: null };
    }).value;
  }

  /**
   * **findMap** finds the first element that after applying the function
   * is not null, consuming all the previous elements.
   * 
   * @example
   * function coolParseInt(s: string): Option<number> {
   *   const num = parseInt(s, 10);
   *   if (Number.isNaN(num)) {
   *     return null;
   *   }
   *   return num;
   * }
   * 
   * const arr = ["lol", "NaN", "2", "5"];
   * const firstNumber = new Iter(arr).findMap(coolParseInt);
   * // firstNumber === 2
   * 
   * @param f The function to apply
   * @returns The first non-null value after the function was applied, if any
   */
  findMap<U>(f: (v: T) => Option<U>): Option<U> {
    return this.tryFold<null, U>(null, (_, v) => {
      const value = f(v);
      if (some(value)) {
        return { success: false, value };
      }
      return { success: true, value: null };
    }).value;
  }

  /**
   * **filter** creates an iterator that returns only the elemnts in the old
   * iterator that satisfy the given predicate
   * 
   * @example
   * const numbers = [1, 2, 3, 4, 5];
   * const coolNumbers = [...new Iter(numbers).filter((n) => n > 2)];
   * console.log(coolNumbers);
   * // [ 3, 4, 5, ]
   * 
   * @param p The predicate to be satisfied
   */
  filter(p: (v: T) => boolean): Iter<T> {
    const next = (): IteratorResult<T> => {
      const value = this.find(p);
      if (some(value)) {
        return { value };
      }
      return { value, done: true };
    };

    return new Iter({ next });
  }

  /**
   * **filterMap** creates an iterator that returns only the non-null elements
   * resulted from applying the passed function to the elements of the old iterator.
   * 
   * @example
   * function coolParseInt(s: string): Option<number> {
   *   const num = parseInt(s, 10);
   *   if (Number.isNaN(num)) {
   *     return null;
   *   }
   *   return num;
   * }
   * const numbers = [...new Iter(["a", "b", "1", "2", "c"]).filterMap(coolParseInt)];
   * console.log(numbers);
   * // [ 1, 2 ]
   * 
   * @param f The function to be applied
   */
  filterMap<U>(f: (v: T) => Option<U>): Iter<U> {
    const next = (): IteratorResult<U> => {
      const value = this.findMap(f);
      if (some(value)) {
        return { value };
      }
      return { value, done: true };
    };

    return new Iter({ next });
  }

  /**
   * **map** creates a new iterator that calls the given function
   * on each element of the old iterator.
   * 
   * In other words, it transforms an iterator over elements of type
   * T into an iterator over elements of type U, where U is the result
   * of the given function
   * 
   * **map** is lazy, meaning that it won't execute until the iterator
   * is consumed. If you want to loop over the collection for side effects
   * use a for..of construct or Iter's **forEach** method.
   * 
   * @example
   * const square = [...new Iter([1, 2, 3, 4]).map((n) => n * n)];
   * console.log(square)
   * // [ 1, 4, 9, 16 ]
   * 
   * @example
   * const arr = [1, 2, 3, 4];
   * new Iter(arr).map(console.log) // this won't execute
   * 
   * // do this
   * for (const elem of arr) {
   *   console.log(elem);
   * }
   * // or this
   * new Iter(arr).forEach(console.log);
   * 
   * @param f The function to apply
   */
  map<U>(f: (v: T) => U): Iter<U> {
    const next = (): IteratorResult<U> => {
      const { value, done } = this.next();
      if (done) {
        return { value, done };
      }
      return { value: f(value) };
    };

    return new Iter({ next });
  }

  /**
   * **cmpBy** lexicographically compares the elements in this iterator
   * to the ones in the other iterator using the given comparator.
   * 
   * The comparator returns a negative number if *lhs* precedes *rhs*, 0
   * if they are equal, or a positive number if *lhs* succeeds *rhs*.
   * 
   * This can be used to compare iterators over distinct types.
   * 
   * If you find yourself comparing types that have partial equality only
   * (not all values can be compared, such as NaN for numbers), use
   * **partialCmpBy** instead.
   * 
   * @param i The iterable or iterator to compare to
   * @param cmp The comparison function
   */
  cmpBy<U>(
    i: IntoIter<U>,
    cmp: (lhs: T, rhs: U) => number,
  ): number {
    const other = new Iter(i);

    while (true) {
      const lhs = this.next();
      const rhs = other.next();

      if (lhs.done) {
        if (rhs.done) {
          return 0;
        }
        return -1;
      }
      if (rhs.done) {
        return 1;
      }

      const cmpRes = cmp(lhs.value, rhs.value);
      if (cmpRes !== 0) {
        return cmpRes;
      }
    }
  }

  /**
   * **cmp** lexicographically compares this iterator to the other.
   * 
   * This function uses strict equality and operators `<` and `>` to compare
   * the values. If this doesn't satisfy your requirement, use **cmpBy** with
   * your custom comparator.
   */
  cmp(i: IntoIter<T>): number {
    return this.cmpBy(i, (lhs, rhs) => {
      if (lhs === rhs) {
        return 0;
      }
      if (lhs < rhs) {
        return -1;
      }
      return 1;
    });
  }

  /**
   * **eqBy** checks if two iterators are equal with the given
   * identity function.
   * 
   * This can be used to compare iterators over distinct types,
   * if needed.
   * 
   * If you find yourself comparing types that have partial equality only
   * (not all values can be compared, such as NaN for numbers), use
   * **partialCmpBy** instead.
   * 
   * @param i The iterable or iterator to compare to
   * @param eq The identity function
   */
  eqBy<U>(i: IntoIter<U>, eq: (lhs: T, rhs: U) => boolean): boolean {
    const other = new Iter(i);

    while (true) {
      const lhs = this.next();
      const rhs = other.next();

      if (lhs.done) {
        return !!rhs.done;
      }
      if (rhs.done) {
        return false;
      }

      if (!eq(lhs.value, rhs.value)) {
        return false;
      }
    }
  }

  /**
   * **eq** determines if this iterator is equal to another
   * using strict equality.
   */
  eq(i: IntoIter<T>): boolean {
    return this.eqBy(i, (lhs, rhs) => lhs === rhs);
  }

  /**
   * **ne** determines if this iterator is not equal to another
   * using strict equality.
   */
  ne(i: IntoIter<T>): boolean {
    return !this.eq(i);
  }

  /**
   * **ge** determines if the elements of this iterator are
   * lexicographically greater or equal than the elements of
   * another.
   */
  ge(i: IntoIter<T>): boolean {
    return this.cmp(i) >= 0;
  }

  /**
   * **gt** determines if the elements of this iterator are
   * lexicographically greater than the elements of another.
   */
  gt(i: IntoIter<T>): boolean {
    return this.cmp(i) > 0;
  }

  /**
   * **le** determines if the elements of this iterator are
   * lexicographically lower or equal to the elements of another.
   */
  le(i: IntoIter<T>): boolean {
    return this.cmp(i) <= 0;
  }

  /**
   * **lt** determines if the elements of this iterator are
   * lexicographically lower than the elements of another.
   */
  lt(i: IntoIter<T>): boolean {
    return this.cmp(i) < 0;
  }

  /**
   * **partialCmpBy** lexicographically compares two iterators using the
   * provided comparator.
   * 
   * Use this function if you're comparing values that have only partial
   * equality relationship (they can't always be compared, such as NaN
   * for numbers). Read further for details.
   * 
   * The difference between **cmpBy** and this function is that this
   * should be used when the two types can't always be compared. Take
   * floating point numbers, for example: NaN is not equal to any other
   * number. If a NaN would exist in an iterator **cmpBy** would simply
   * return false, which is not a valid result in this situation.
   * 
   * @example
   * function cmpNumbers(lhs: nummber, rhs: number): Option<number> {
   *   if (Number.isNaN(lhs) || Number.isNaN(rhs)) {
   *     return null;
   *   }
   *   return lhs - rhs;
   * }
   * 
   * const lhs = [1.0, 2.3, 4.6, 7.8];
   * new Iter(lhs).partialCmpBy([1.0, 2.3, 4.6, 7.8], cmpNumbers) // === 0
   * new Iter(lhs).partialCmpBy([1.0, 2.2, NaN, 7.8], cmpNumbers) // > 0
   * new Iter(lhs).partialCmpBy([1.0, 2.3, NaN, 7.8], cmpNumbers) // === null
   * 
   * @param i The iterable or iterator to compare to.
   * @param cmp The comparison function.
   */
  partialCmpBy<U>(
    i: IntoIter<U>,
    cmp: (lhs: T, rhs: U) => Option<number>,
  ): Option<number> {
    const other = new Iter(i);

    while (true) {
      const lhs = this.next();
      const rhs = other.next();

      if (lhs.done) {
        if (rhs.done) {
          return 0;
        }
        return -1;
      }
      if (rhs.done) {
        return 1;
      }

      const cmpRes = cmp(lhs.value, rhs.value);
      if (!some(cmpRes) || cmpRes !== 0) {
        return cmpRes;
      }
    }
  }
}
