import { assert, assertEquals } from "https://deno.land/std/testing/asserts.ts";

import { Iter } from "./mod.ts";

Deno.test("Iter is iterable", () => {
  const expect = [1, 2, 3, 4];
  const got = [...new Iter(expect)];
  assertEquals(got, expect);
});

Deno.test("Iter is consumable", () => {
  const it = new Iter([1, 2, 3, 4]);
  for (const _ of it);
  const { done } = it.next();
  assert(done);
});

Deno.test("Iter.enumerate", () => {
  const arr = [1, 2, 3, 4];
  const got = [...new Iter(arr).enumerate()];
  const expect = [[0, 1], [1, 2], [2, 3], [3, 4]];
  assertEquals(got, expect);
});
