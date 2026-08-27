import { eq } from "drizzle-orm";
import { accounts } from "../drizzle/schema";

export const archiveRetentionDayChoices = [7, 15, 30, 60, 90] as const;
export type ArchiveRetentionDays = typeof archiveRetentionDayChoices[number];

export function isArchiveRetentionDays(value: number): value is ArchiveRetentionDays {
  return archiveRetentionDayChoices.includes(value as ArchiveRetentionDays);
}

export function archivePurgeAfter(retentionDays: number, archivedAt = new Date()) {
  const safeRetentionDays = isArchiveRetentionDays(retentionDays) ? retentionDays : 30;
  return new Date(archivedAt.getTime() + safeRetentionDays * 86_400_000);
}

export async function getAccountArchivePolicy(db: any, accountId: number) {
  const account = (await db.select({ archiveRetentionDays: accounts.archiveRetentionDays, allowImmediateArchiveDeletion: accounts.allowImmediateArchiveDeletion }).from(accounts).where(eq(accounts.id, accountId)).limit(1))[0];
  if (!account) throw new Error("Compte introuvable.");
  const retentionDays = isArchiveRetentionDays(Number(account.archiveRetentionDays)) ? Number(account.archiveRetentionDays) as ArchiveRetentionDays : 30;
  return { retentionDays, allowImmediateDeletion: Boolean(account.allowImmediateArchiveDeletion) } as const;
}

export async function archivePurgeAfterForAccount(db: any, accountId: number, archivedAt = new Date()) {
  const policy = await getAccountArchivePolicy(db, accountId);
  return archivePurgeAfter(policy.retentionDays, archivedAt);
}
