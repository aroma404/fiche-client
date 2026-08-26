import { and, asc, eq, isNull } from "drizzle-orm";
import { programClientStatuses } from "../drizzle/schema";
import { getDb } from "./db";

type Database = NonNullable<Awaited<ReturnType<typeof getDb>>>;

const defaultClientStatuses = [
  { label: "Actif", isOperational: true, sortOrder: 10 },
  { label: "Radié", isOperational: false, sortOrder: 20 },
] as const;

export async function listProgramClientStatuses(db: Database, accountId: number) {
  const existing = await db.select().from(programClientStatuses).where(and(eq(programClientStatuses.accountId, accountId), isNull(programClientStatuses.deletedAt))).orderBy(asc(programClientStatuses.sortOrder), asc(programClientStatuses.label));
  if (existing.length) return existing;
  try {
    await db.insert(programClientStatuses).values(defaultClientStatuses.map(status => ({ accountId, ...status })));
  } catch {
    // Une autre requête peut avoir initialisé les statuts entre les deux lectures.
  }
  return db.select().from(programClientStatuses).where(and(eq(programClientStatuses.accountId, accountId), isNull(programClientStatuses.deletedAt))).orderBy(asc(programClientStatuses.sortOrder), asc(programClientStatuses.label));
}

export async function assertProgramClientStatus(db: Database, accountId: number, status: string) {
  const statuses = await listProgramClientStatuses(db, accountId);
  if (!statuses.some(item => item.label === status)) throw new Error("Le statut choisi n’est pas disponible dans les réglages de votre programme.");
}

export function programClientStatusScope(accountId: number, statusId: number) {
  return and(eq(programClientStatuses.accountId, accountId), eq(programClientStatuses.id, statusId));
}
