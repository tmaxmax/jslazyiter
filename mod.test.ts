import {
  assert,
  assertEquals,
  assertStrictEquals,
} from "https://deno.land/std/testing/asserts.ts";
import { add } from "https://deno.land/x/fae@v1.0.0/mod.ts";

import Iter from "./mod.ts";
import { none, some } from "./option.ts";
import { Result } from "./result.ts";
import { cmpNumbers, parseIntegral, range } from "./util.ts";

Deno.test("is iterable", () => {
  const expect = [1, 2, 3, 4];
  const got = [...new Iter(expect)];
  assertEquals(got, expect);
});

Deno.test("is consumable", () => {
  const it = new Iter([1, 2, 3, 4]);
  for (const _ of it);
  const { done } = it.next();
  assert(done);
});

Deno.test("enumerate", () => {
  const arr = [1, 2, 3, 4];
  const got = [...new Iter(arr).enumerate()];
  const expect = [[0, 1], [1, 2], [2, 3], [3, 4]];
  assertEquals(got, expect);
});

Deno.test("fold", () => {
  assertStrictEquals(new Iter([1, 2, 3, 4]).fold(0, add), 10);
  assertStrictEquals(
    new Iter([] as number[]).fold(0, add),
    0,
    "expect inital value on empty iterator",
  );
});

Deno.test("tryFold", () => {
  const fn = (acc: number, v: string): Result<number, string> => {
    const num = parseIntegral(v);
    if (none(num)) {
      return { success: false, value: v };
    }
    return { success: true, value: acc + num };
  };

  assertEquals(new Iter(["1", "2", "3", "4"]).tryFold(0, fn), {
    success: true,
    value: 10,
  });
  assertEquals(new Iter(["1", "2", "a", "b"]).tryFold(0, fn), {
    success: false,
    value: "a",
  });
});

Deno.test("filter", () => {
  assertEquals([...new Iter([1, 2, 3, 4]).filter((n) => n > 2)], [3, 4]);
});

Deno.test("filterMap", () => {
  assertEquals([
    ...new Iter(["0", "2", "a", "4", "b"]).filterMap(parseIntegral),
  ], [0, 2, 4]);
});

Deno.test("map", () => {
  assertEquals([...new Iter([1, 2, 3, 4]).map(add(1))], [2, 3, 4, 5]);
});

Deno.test("cmpBy", () => {
  const lhs = ["foo", "bar", "baz"];
  const cmp = (lhs: string, rhs: string) => lhs.length - rhs.length;
  assert(new Iter(lhs).cmpBy(["abc", "def", "ghi"], cmp) === 0);
  assert(new Iter(lhs).cmpBy(["abc", "defg", "hi"], cmp) < 0);
  assert(new Iter(lhs).cmpBy(["abc", "de", "fghi"], cmp) > 0);
});

Deno.test("eqBy", () => {
  const lhs = [1, 2, 3];
  const eq = (lhs: number, rhs: number) => lhs * lhs === rhs * rhs;
  assert(new Iter(lhs).eqBy([1, -2, 3], eq));
  assert(!(new Iter(lhs).eqBy([1, -3, 2], eq)));
});

Deno.test("partialCmpBy", () => {
  const lhs = [1.4, 2.6, 3.7, 7.8];
  {
    const res = new Iter(lhs).partialCmpBy([1.4, 2.6, 3.7, 7.8], cmpNumbers);
    assert(some(res) && res === 0);
  }
  assert(new Iter(lhs).partialCmpBy([1.4, 2.6, NaN, 7.8], cmpNumbers) === null);
  {
    const res = new Iter(lhs).partialCmpBy([1.4, 2.5, NaN, 7.8], cmpNumbers);
    assert(some(res) && res > 0);
  }
});

Deno.test("all", () => {
  {
    const iter = new Iter([1, 2, 3, 4]);
    assert(iter.all((n) => n > 0));
    assert(iter.next().done, "iterator shall be fully consumed");
  }
  {
    const iter = new Iter([1, 2, 3, 4]);
    assert(!iter.all((n) => n < 3));
    const next = iter.next();
    assert(
      !next.done && next.value === 4,
      "iterator shall not be fully consumed",
    );
  }
});

Deno.test("any", () => {
  {
    const iter = new Iter([1, 2, 3, 4]);
    assert(iter.any((n) => n > 2));
    const next = iter.next();
    assert(
      !next.done && next.value === 4,
      "iterator shall not be fully consumed",
    );
  }
  {
    const iter = new Iter([1, 2, 3, 4]);
    assert(!iter.any((n) => n < 1));
    assert(iter.next().done, "iterator shall be fully consumed");
  }
});

Deno.test("max", () => {
  assertStrictEquals(new Iter([1, 2, 3, 4]).max(), 4);
  assertStrictEquals(new Iter([]).max(), null);
});

Deno.test("maxByKey", () => {
  assertStrictEquals(new Iter([1, 2, 3, 4]).maxByKey((v) => -v), 1);
});

Deno.test("min", () => {
  assertStrictEquals(new Iter([1, 2, 3, 4]).min(), 1);
  assertStrictEquals(new Iter([]).min(), null);
});

Deno.test("minByKey", () => {
  assertStrictEquals(new Iter([1, 2, 3, 4]).minByKey((v) => -v), 4);
});

Deno.test("zip", () => {
  const a = [1, 2, 3, 4].reverse();
  assertEquals([...new Iter(a).zip(range())], [[4, 0], [3, 1], [2, 2], [1, 3]]);
});
