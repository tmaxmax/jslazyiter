export class Iter<T> implements Iterable<T> {
  private readonly iter: Iterator<T>

  constructor(iterable: Iterable<T>)
  constructor(iterator: Iterator<T>)
  constructor(iter: Iterator<T> | Iterable<T>) {
    if (Symbol.iterator in iter) {
      this.iter = (iter as Iterable<T>)[Symbol.iterator]()
    } else {
      this.iter = iter as Iterator<T>
    }
  }

  [Symbol.iterator]() {
    return this.iter
  }
}
