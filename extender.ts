// type TypedConstructor<T> = [T] extends [number] ?
//   | Uint8ArrayConstructor
//   | Uint16ArrayConstructor
//   | Uint32ArrayConstructor
//   | Uint8ClampedArrayConstructor
//   | Int8ArrayConstructor
//   | Int16ArrayConstructor
//   | Int32ArrayConstructor
//   : never;

// type BigTypedConstructor<T> = [T] extends [bigint] ?
//   | BigUint64ArrayConstructor
//   | BigInt64ArrayConstructor
//   : never;

type IndependentConstructors =
  | StringConstructor
  | ArrayConstructor
  | SetConstructor;

export type Constructor<T> = [T] extends [[unknown, unknown]]
  ? MapConstructor | IndependentConstructors
  : IndependentConstructors;

// type TypedCollection<Data, Constructor> = [Data] extends [number]
//   ? [Constructor] extends [Uint8ArrayConstructor] ? Uint8Array
//   : [Constructor] extends [Uint16ArrayConstructor] ? Uint16Array
//   : [Constructor] extends [Uint32ArrayConstructor] ? Uint32Array
//   : [Constructor] extends [Uint8ClampedArrayConstructor] ? Uint32Array
//   : [Constructor] extends [Int8ArrayConstructor] ? Int8Array
//   : [Constructor] extends [Int16ArrayConstructor] ? Int16Array
//   : [Constructor] extends [Int32ArrayConstructor] ? Int32Array
//   : never
//   : never;

// type BigTypedCollection<Data, Constructor> = [Data] extends [bigint]
//   ? [Constructor] extends [BigUint64ArrayConstructor] ? BigUint64Array
//   : [Constructor] extends [BigInt64ArrayConstructor] ? BigInt64Array
//   : never
//   : never;

type MapCollection<Data, Constructor> = [Data] extends [[infer K, infer V]]
  ? [Constructor] extends [MapConstructor] ? Map<K, V> : never
  : never;

type StringCollection<Data, Constructor> = [Data] extends [string]
  ? [Constructor] extends [StringConstructor] ? string : never
  : never;

export type Collection<Data, Constructor> = [Constructor] extends
  [ArrayConstructor] ? Data[]
  : [Constructor] extends [SetConstructor] ? Set<Data>
  : 
    | StringCollection<Data, Constructor>
    | MapCollection<Data, Constructor>;

type Extender<Data, Collection> = (c: Collection, d: Data) => Collection;

export default function <
  T,
>(
  constructor: Constructor<T>,
): [
  Collection<T, typeof constructor>,
  Extender<T, Collection<T, typeof constructor>>,
] {
  type Collect = Collection<T, typeof constructor>;
  // deno-lint-ignore no-explicit-any
  const collection = new (constructor as any)() as Collect;
  let extender: Extender<T, Collect>;
  if (collection instanceof Map) {
    // deno-lint-ignore no-explicit-any
    extender = (c, v) => ((c as any).set((v as any)[0], (v as any)[1]), c);
  } else if (collection instanceof Set) {
    // deno-lint-ignore no-explicit-any
    extender = (c, v) => ((c as any).add(v), c);
  } else if (collection instanceof String) {
    // deno-lint-ignore no-explicit-any
    extender = (c, v) => c as any + v as any;
  } else if (Array.isArray(collection)) {
    // deno-lint-ignore no-explicit-any
    extender = (c, v) => ((c as any).push(v), c);
  } else {
    throw new TypeError("Iter: Invalid type to collect into");
  }
  return [collection, extender];
}
