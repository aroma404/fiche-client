import { describe, expect, it, vi } from "vitest";
import { allocateNextClientReference, formatClientReference } from "./client-reference";

describe("références client séquentielles", () => {
  it("alloue la valeur atomique renvoyée par le compteur de compte", async () => {
    const execute = vi.fn().mockResolvedValueOnce({ affectedRows: 1 }).mockResolvedValueOnce([[{ referenceNumber: 27 }]]);

    await expect(allocateNextClientReference({ execute }, 12)).resolves.toBe(27);
    expect(execute).toHaveBeenCalledTimes(2);
  });

  it("refuse une réponse de compteur invalide", async () => {
    const execute = vi.fn().mockResolvedValueOnce({ affectedRows: 1 }).mockResolvedValueOnce([[{ referenceNumber: 0 }]]);

    await expect(allocateNextClientReference({ execute }, 12)).rejects.toThrow("Attribution de référence client impossible.");
  });

  it("présente les références avec trois chiffres au minimum", () => {
    expect(formatClientReference(1)).toBe("001");
    expect(formatClientReference(27)).toBe("027");
    expect(formatClientReference(1250)).toBe("1250");
    expect(formatClientReference(null)).toBe("—");
  });
});
