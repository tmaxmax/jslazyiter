import type { Option } from "./option.ts";

export function parseIntegral(s: string): Option<number> {
  const num = parseInt(s);
  if (Number.isNaN(num)) {
    return null;
  }
  return num;
}
