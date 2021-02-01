import { cmpNumbers, parseIntegral } from "./util.ts";
import { none, some } from "./option.ts";
import { assert } from "https://deno.land/std@0.85.0/testing/asserts.ts";

Deno.test("utilities: parseIntegral", () => {
  assert(some(parseIntegral("12345")));
  assert(none(parseIntegral("sarmale")));
});

Deno.test("utilities: cmpNumbers", () => {
  {
    const res = cmpNumbers(1, 1);
    assert(some(res) && res === 0);
  }
  {
    const res = cmpNumbers(1, 2);
    assert(some(res) && res < 0);
  }
  {
    const res = cmpNumbers(43, 21);
    assert(some(res) && res > 0);
  }
  assert(none(cmpNumbers(1, NaN)));
  assert(none(cmpNumbers(NaN, 32)));
});
