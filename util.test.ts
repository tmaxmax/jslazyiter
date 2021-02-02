import { cmpNumbers, parseIntegral, range } from "./util.ts";
import { none, some } from "./option.ts";
import {
  assert,
  assertEquals,
  assertThrows,
} from "https://deno.land/std@0.85.0/testing/asserts.ts";

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

Deno.test("utilities: range", () => {
  assertEquals([...range(5)], [0, 1, 2, 3, 4]);
  assertEquals([...range(3, 7)], [3, 4, 5, 6]);
  assertEquals([...range(2, true)], [0, 1, 2]);
  assertEquals([...range(2, 3, true)], [2, 3]);
  assertEquals([...range(2, 8, 2)], [2, 4, 6]);
  assertEquals([...range(2, 6, 2, true)], [2, 4, 6]);
  assertThrows(
    () => [...range(-1)],
    Error,
    "Invalid range: begin 0 is greater than end -1",
  );
  assertThrows(
    () => [...range(5, 3)],
    Error,
    "Invalid range: begin 5 is greater than end 3",
  );
});
