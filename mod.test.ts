import { assertEquals } from "https://deno.land/std/testing/asserts.ts";

import Iter from "./mod.ts";

Deno.test("Iter is iterable", () => {
  const expect = [1, 2, 3, 4];
  const got = [...new Iter(expect)];
  assertEquals(got, expect);
});
