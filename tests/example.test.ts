import { describe, expect, it } from "vitest";

// Minimal sanity test to ensure the test runner is wired up

describe("sanity check", () => {
  it("adds numbers correctly", () => {
    expect(1 + 1).toBe(2);
  });
});
