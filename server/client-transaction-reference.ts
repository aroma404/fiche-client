import { sql } from "drizzle-orm";

/** Alloue une référence de transaction locale au dossier courant, dans sa transaction SQL. */
export async function allocateNextClientTransactionReference(tx: any, clientId: number) {
  await tx.execute(sql`
    INSERT INTO client_transaction_counters (clientId, nextReference)
    VALUES (${clientId}, LAST_INSERT_ID(1) + 1)
    ON DUPLICATE KEY UPDATE nextReference = LAST_INSERT_ID(nextReference) + 1
  `);
  const result = await tx.execute(sql`SELECT LAST_INSERT_ID() AS transactionReference`);
  const rows = Array.isArray(result) && Array.isArray(result[0]) ? result[0] : result;
  const transactionReference = Number((rows as any)?.[0]?.transactionReference);
  if (!Number.isSafeInteger(transactionReference) || transactionReference < 1) {
    throw new Error("Attribution de référence de transaction impossible.");
  }
  return transactionReference;
}

export function formatTransactionReference(value: number | null | undefined) {
  if (!value || value < 1) return "—";
  return String(value).padStart(3, "0");
}

/** Recalcule le prochain numéro après un import ou un backfill contrôlé. */
export async function ensureClientTransactionCounter(tx: any, clientId: number, nextReference: number) {
  await tx.execute(sql`
    INSERT INTO client_transaction_counters (clientId, nextReference)
    VALUES (${clientId}, ${nextReference})
    ON DUPLICATE KEY UPDATE nextReference = GREATEST(nextReference, ${nextReference})
  `);
}
