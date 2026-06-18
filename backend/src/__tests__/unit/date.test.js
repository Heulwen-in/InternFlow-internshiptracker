const { toDate } = require("../../utils/date");

describe("toDate", () => {
  test("returns undefined for undefined — Prisma skips the field on update", () => {
    expect(toDate(undefined)).toBeUndefined();
  });

  test("returns null for null — Prisma sets the column to NULL", () => {
    expect(toDate(null)).toBeNull();
  });

  test("returns null for empty string", () => {
    expect(toDate("")).toBeNull();
  });

  test("returns null for 0 (falsy number)", () => {
    expect(toDate(0)).toBeNull();
  });

  test("returns a Date object for a valid ISO date string", () => {
    const result = toDate("2025-06-18");
    expect(result).toBeInstanceOf(Date);
    expect(isNaN(result.getTime())).toBe(false);
  });

  test("returns the correct point in time for a full ISO string", () => {
    const result = toDate("2025-06-18T10:00:00.000Z");
    expect(result).toBeInstanceOf(Date);
    expect(result.toISOString()).toBe("2025-06-18T10:00:00.000Z");
  });
});
