import { describe, expect, it } from "vitest";
import { hasTimeOverlap, timeToMinutes } from "./db";

describe("booking availability rules", () => {
  it("reserves the travel buffer between two appointments", () => {
    expect(hasTimeOverlap(timeToMinutes("10:00"), timeToMinutes("10:45"), timeToMinutes("11:00"), timeToMinutes("11:45"))).toBe(true);
    expect(hasTimeOverlap(timeToMinutes("08:00"), timeToMinutes("08:45"), timeToMinutes("10:00"), timeToMinutes("10:45"))).toBe(false);
  });
});
