import { sql } from "drizzle-orm";

/** Alloue une référence positive unique dans la transaction du compte courant. */
export async function allocateNextClientReference(tx: any, accountId: number) {
  await tx.execute(sql`
    INSERT INTO client_reference_counters (accountId, nextReference)
    VALUES (${accountId}, LAST_INSERT_ID(1) + 1)
    ON DUPLICATE KEY UPDATE nextReference = LAST_INSERT_ID(nextReference) + 1
  `);
  const result = await tx.execute(sql`SELECT LAST_INSERT_ID() AS referenceNumber`);
  const rows = Array.isArray(result) && Array.isArray(result[0]) ? result[0] : result;
  const referenceNumber = Number((rows as any)?.[0]?.referenceNumber);
  if (!Number.isSafeInteger(referenceNumber) || referenceNumber < 1) throw new Error("Attribution de référence client impossible.");
  return referenceNumber;
}

export function formatClientReference(referenceNumber: number | null | undefined) {
  if (!referenceNumber || referenceNumber < 1) return "—";
  return String(referenceNumber).padStart(3, "0");
}
