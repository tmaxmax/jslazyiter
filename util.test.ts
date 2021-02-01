import { parseIntegral } from "./util.ts";
import { none, some } from "./option.ts";
import { assert } from "https://deno.land/std@0.85.0/testing/asserts.ts";

Deno.test("utilities: parseIntegral", () => {
  assert(some(parseIntegral("12345")));
  assert(none(parseIntegral("sarmale")));
});
