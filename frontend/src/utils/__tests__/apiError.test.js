import { describe, expect, test } from "vitest";
import { getApiErrorMessage } from "../apiError";

describe("getApiErrorMessage", () => {
  test("prefers a backend message", () => {
    expect(
      getApiErrorMessage({
        response: { data: { message: "Application not found" } },
      })
    ).toBe("Application not found");
  });

  test("normalizes network errors", () => {
    expect(getApiErrorMessage({ code: "ERR_NETWORK" })).toMatch(
      /check your connection/i
    );
  });

  test("uses the supplied fallback", () => {
    expect(getApiErrorMessage({ response: { data: {} } }, "Try again")).toBe(
      "Try again"
    );
  });
});
