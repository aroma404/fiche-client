import { describe, expect, it } from "vitest";
import { formatTransactionReference } from "./client-transaction-reference";

describe("client transaction references", () => {
  it("formats the first client transaction as 001 and increments to 002", () => {
    expect(formatTransactionReference(1)).toBe("001");
    expect(formatTransactionReference(2)).toBe("002");
    expect(formatTransactionReference(12)).toBe("012");
  });

  it("does not invent a reference for cabinet-only operations", () => {
    expect(formatTransactionReference(null)).toBe("—");
    expect(formatTransactionReference(undefined)).toBe("—");
  });
});
