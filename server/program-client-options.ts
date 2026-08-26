import { and, asc, eq, isNull } from "drizzle-orm";
import { programClientOptions } from "../drizzle/schema";
import { accountOptionDefaults, accountOptionKinds, type AccountOptionKind } from "../shared/reference-registry";

export { accountOptionKinds as programOptionKinds };
export type ProgramOptionKind = AccountOptionKind;

export const clientColumnForOption = { legalForm: "legalForm", clientType: "clientType", regime: "regime" } as const;

export async function listProgramClientOptions(db: any, accountId: number, kind: ProgramOptionKind) {
  let rows = await db.select().from(programClientOptions).where(and(eq(programClientOptions.accountId, accountId), eq(programClientOptions.kind, kind), isNull(programClientOptions.deletedAt))).orderBy(asc(programClientOptions.sortOrder), asc(programClientOptions.label));
  if (!rows.length) {
    await db.insert(programClientOptions).values(accountOptionDefaults[kind].map((item, index) => ({ accountId, kind, ...item, sortOrder: (index + 1) * 10 })));
    rows = await db.select().from(programClientOptions).where(and(eq(programClientOptions.accountId, accountId), eq(programClientOptions.kind, kind), isNull(programClientOptions.deletedAt))).orderBy(asc(programClientOptions.sortOrder), asc(programClientOptions.label));
  }
  return rows;
}

export async function resolveProgramClientOption(db: any, accountId: number, kind: ProgramOptionKind, label: string) {
  const options = await listProgramClientOptions(db, accountId, kind);
  const option = options.find((item: any) => item.label.localeCompare(label, "fr", { sensitivity: "accent" }) === 0);
  if (!option) throw new Error("La valeur choisie n’est pas autorisée dans les réglages du programme.");
  return option;
}
