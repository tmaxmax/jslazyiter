export default class Iter<T> implements Iterable<T> {
  constructor(private readonly iter: Iterable<T>) {}

  [Symbol.iterator]() {
    return this.iter[Symbol.iterator]();
  }
}
