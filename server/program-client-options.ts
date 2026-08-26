import { and, asc, eq, isNull } from "drizzle-orm";
import { programClientOptions } from "../drizzle/schema";

export const programOptionKinds = ["legalForm", "clientType", "regime"] as const;
export type ProgramOptionKind = typeof programOptionKinds[number];

const defaults: Record<ProgramOptionKind, Array<{ code: string; label: string }>> = {
  legalForm: [{ code: "physical", label: "Personne physique" }, { code: "legal", label: "Personne morale" }],
  clientType: [{ code: "new", label: "Nouveau client" }, { code: "former", label: "Ancien client" }],
  regime: [{ code: "real", label: "Régime réel" }, { code: "simplified", label: "Régime réel simplifié" }, { code: "ifu", label: "Régime IFU" }],
};

export const clientColumnForOption = { legalForm: "legalForm", clientType: "clientType", regime: "regime" } as const;

export async function listProgramClientOptions(db: any, accountId: number, kind: ProgramOptionKind) {
  let rows = await db.select().from(programClientOptions).where(and(eq(programClientOptions.accountId, accountId), eq(programClientOptions.kind, kind), isNull(programClientOptions.deletedAt))).orderBy(asc(programClientOptions.sortOrder), asc(programClientOptions.label));
  if (!rows.length) {
    await db.insert(programClientOptions).values(defaults[kind].map((item, index) => ({ accountId, kind, ...item, sortOrder: (index + 1) * 10 })));
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
