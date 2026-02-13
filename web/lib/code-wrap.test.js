import { describe, expect, it } from "bun:test";
import { wrapCodeLinesByMaxChars } from "@/lib/code-wrap";

describe("wrapCodeLinesByMaxChars", () => {
  it("keeps lines at 200 chars unchanged", () => {
    const input = "a".repeat(200);
    expect(wrapCodeLinesByMaxChars(input)).toBe(input);
  });

  it("wraps a long line every 200 chars", () => {
    const input = "a".repeat(201);
    expect(wrapCodeLinesByMaxChars(input)).toBe(`${"a".repeat(200)}\na`);
  });
});
