import { and, count, desc, eq, isNull } from "drizzle-orm";
import { clients, programRcCatalogueEntries } from "../drizzle/schema";
import { activitiesForRegistreCommerceFamily, registreCommerceActivities, registreCommerceFamilies } from "../shared/registre-commerce-activities";
import { normalizeRcCatalogueEntries, rcFamiliesFromEntries, type RcCatalogueEntryInput } from "../shared/rc-catalogue";

export type RcCatalogueActivity = { code: string; label: string };
type EffectiveRcEntry = { code: string; label: string; familyCode: string };

async function customCatalogueExists(db: any, accountId: number) {
  const first = await db.select({ id: programRcCatalogueEntries.id }).from(programRcCatalogueEntries).where(eq(programRcCatalogueEntries.accountId, accountId)).limit(1);
  return Boolean(first[0]);
}

async function getCustomEntries(db: any, accountId: number): Promise<EffectiveRcEntry[]> {
  const rows = await db.select({ activityCode: programRcCatalogueEntries.activityCode, familyCode: programRcCatalogueEntries.familyCode, label: programRcCatalogueEntries.label }).from(programRcCatalogueEntries).where(eq(programRcCatalogueEntries.accountId, accountId)).orderBy(programRcCatalogueEntries.activityCode);
  return rows.map((row: any) => ({ code: row.activityCode, familyCode: row.familyCode, label: row.label }));
}

export async function getEffectiveRcCatalogueEntries(db: any, accountId: number): Promise<EffectiveRcEntry[]> {
  if (await customCatalogueExists(db, accountId)) return getCustomEntries(db, accountId);
  return registreCommerceActivities.map(activity => ({ ...activity, familyCode: activity.code.slice(0, 3) }));
}

export async function getRcCatalogueSummary(db: any, accountId: number) {
  const [latest, total] = await Promise.all([
    db.select({ sourceFilename: programRcCatalogueEntries.sourceFilename, importedAt: programRcCatalogueEntries.importedAt }).from(programRcCatalogueEntries).where(eq(programRcCatalogueEntries.accountId, accountId)).orderBy(desc(programRcCatalogueEntries.importedAt)).limit(1),
    db.select({ value: count() }).from(programRcCatalogueEntries).where(eq(programRcCatalogueEntries.accountId, accountId)),
  ]);
  const activityCount = Number(total[0]?.value ?? 0);
  if (!activityCount) return { source: "catalogue de référence", sourceFilename: null, importedAt: null, activityCount: registreCommerceActivities.length, familyCount: registreCommerceFamilies.length, isCustom: false };
  const families = await getRcCatalogueFamilies(db, accountId);
  return { source: "fichier Excel du cabinet", sourceFilename: latest[0]?.sourceFilename ?? null, importedAt: latest[0]?.importedAt ?? null, activityCount, familyCount: families.length, isCustom: true };
}

export async function getRcCatalogueFamilies(db: any, accountId: number) {
  const entries = await getEffectiveRcCatalogueEntries(db, accountId);
  return rcFamiliesFromEntries(entries);
}

export async function getRcCatalogueActivities(db: any, accountId: number, familyCode: string): Promise<RcCatalogueActivity[]> {
  if (!(await customCatalogueExists(db, accountId))) return activitiesForRegistreCommerceFamily(familyCode);
  return db.select({ code: programRcCatalogueEntries.activityCode, label: programRcCatalogueEntries.label }).from(programRcCatalogueEntries).where(and(eq(programRcCatalogueEntries.accountId, accountId), eq(programRcCatalogueEntries.familyCode, familyCode))).orderBy(programRcCatalogueEntries.activityCode);
}

export async function resolveRcActivityForAccount(db: any, accountId: number, familyCode: string, activityCode: string) {
  if (!familyCode || !activityCode) throw new Error("Choisissez une catégorie et une activité RC.");
  const activities = await getRcCatalogueActivities(db, accountId, familyCode);
  const activity = activities.find(entry => entry.code === activityCode);
  if (!activity) throw new Error("Choisissez une activité valide de votre catalogue RC.");
  return activity;
}

async function writeRcCatalogue(db: any, accountId: number, sourceFilename: string, rawEntries: readonly RcCatalogueEntryInput[]) {
  const entries = normalizeRcCatalogueEntries(rawEntries);
  const filename = sourceFilename.trim().slice(0, 255);
  if (!/\.(xlsx|xls|xlsb|csv)$/i.test(filename)) throw new Error("Importez uniquement un fichier Excel ou CSV de nomenclature RC.");
  await assertActiveClientReferencesAllowed(db, accountId, entries);
  await db.transaction(async (tx: any) => {
    await tx.delete(programRcCatalogueEntries).where(eq(programRcCatalogueEntries.accountId, accountId));
    await tx.insert(programRcCatalogueEntries).values(entries.map(entry => ({ accountId, familyCode: entry.familyCode, activityCode: entry.code, label: entry.label, sourceFilename: filename })));
  });
  return { activityCount: entries.length, familyCount: rcFamiliesFromEntries(entries).length, sourceFilename: filename };
}

export async function replaceRcCatalogueFromExcel(db: any, accountId: number, sourceFilename: string, rawEntries: readonly RcCatalogueEntryInput[]) { return writeRcCatalogue(db, accountId, sourceFilename, rawEntries); }
export async function mergeRcCatalogueFromExcel(db: any, accountId: number, sourceFilename: string, rawEntries: readonly RcCatalogueEntryInput[]) {
  const current = await getEffectiveRcCatalogueEntries(db, accountId);
  const merged = new Map(current.map(entry => [entry.code, { code: entry.code, label: entry.label }]));
  for (const entry of normalizeRcCatalogueEntries(rawEntries)) merged.set(entry.code, { code: entry.code, label: entry.label });
  return writeRcCatalogue(db, accountId, sourceFilename, Array.from(merged.values()));
}
export async function resetRcCatalogueToReference(db: any, accountId: number) { await assertActiveClientReferencesAllowed(db, accountId, registreCommerceActivities.map(activity => ({ ...activity, familyCode: activity.code.slice(0, 3) }))); await db.delete(programRcCatalogueEntries).where(eq(programRcCatalogueEntries.accountId, accountId)); return { success: true as const }; }

async function assertActiveClientReferencesAllowed(db: any, accountId: number, allowedEntries: readonly EffectiveRcEntry[]) {
  const used = await db.select({ familyCode: clients.rcActivityFamily, activityCode: clients.rcActivityCode }).from(clients).where(and(eq(clients.accountId, accountId), eq(clients.activityKind, "Registre de commerce"), isNull(clients.deletedAt)));
  const allowed = new Set(allowedEntries.map(entry => `${entry.familyCode}:${entry.code}`));
  const invalidCount = used.filter((entry: any) => !allowed.has(`${entry.familyCode}:${entry.activityCode}`)).length;
  if (invalidCount) throw new Error(`${invalidCount} dossier(s) utilisent une activité absente du fichier. Conservez-la ou modifiez d’abord ces dossiers.`);
}
