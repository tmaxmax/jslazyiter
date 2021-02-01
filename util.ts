import type { Option } from "./option.ts";

export function parseIntegral(s: string): Option<number> {
  const num = parseInt(s);
  if (Number.isNaN(num)) {
    return null;
  }
  return num;
}

export function cmpNumbers(lhs: number, rhs: number): Option<number> {
  if (Number.isNaN(lhs) || Number.isNaN(rhs)) {
    return null;
  }
  return lhs - rhs;
}
