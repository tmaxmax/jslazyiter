import {
  assert,
  assertEquals,
  assertStrictEquals,
} from "https://deno.land/std/testing/asserts.ts";
import { add } from "https://deno.land/x/fae@v1.0.0/mod.ts";

import { Iter } from "./mod.ts";
import { none } from "./option.ts";
import { Result } from "./result.ts";
import { parseIntegral } from "./util.ts";

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
