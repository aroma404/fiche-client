import { and, asc, count, desc, eq, isNotNull, isNull } from "drizzle-orm";
import { clients, programRcCatalogueEntries, programRcCatalogueFamilies } from "../drizzle/schema";
import { activitiesForRegistreCommerceFamily, registreCommerceActivities, registreCommerceFamilies } from "../shared/registre-commerce-activities";
import { normalizeRcCatalogueEntries, rcFamiliesFromEntries, type RcCatalogueEntry, type RcCatalogueEntryInput } from "../shared/rc-catalogue";

export type RcCatalogueActivity = { id?: number; code: string; label: string };
export type RcCatalogueFamily = { id?: number; code: string; label: string; activityCount: number };
type EffectiveRcEntry = RcCatalogueEntry;
const REFERENCE_SOURCE = "Référence initiale du programme";
const purgeAfterThirtyDays = () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

async function catalogueIsMaterialized(db: any, accountId: number) {
  const first = await db.select({ id: programRcCatalogueFamilies.id }).from(programRcCatalogueFamilies).where(eq(programRcCatalogueFamilies.accountId, accountId)).limit(1);
  return Boolean(first[0]);
}

async function materializeReferenceCatalogue(db: any, accountId: number) {
  if (await catalogueIsMaterialized(db, accountId)) return;
  const referenceEntries = registreCommerceActivities.map(activity => ({ ...activity, familyCode: activity.code.slice(0, 3) }));
  const families = rcFamiliesFromEntries(referenceEntries);
  await db.transaction(async (tx: any) => {
    const exists = await tx.select({ id: programRcCatalogueFamilies.id }).from(programRcCatalogueFamilies).where(eq(programRcCatalogueFamilies.accountId, accountId)).limit(1);
    if (exists[0]) return;
    await tx.insert(programRcCatalogueFamilies).values(families.map(family => ({ accountId, code: family.code, label: family.label, sourceFilename: REFERENCE_SOURCE })));
    await tx.insert(programRcCatalogueEntries).values(referenceEntries.map(entry => ({ accountId, familyCode: entry.familyCode, activityCode: entry.code, label: entry.label, sourceFilename: REFERENCE_SOURCE })));
  });
}

async function getActiveCustomFamilies(db: any, accountId: number) {
  const [families, activities] = await Promise.all([
    db.select().from(programRcCatalogueFamilies).where(and(eq(programRcCatalogueFamilies.accountId, accountId), isNull(programRcCatalogueFamilies.deletedAt))).orderBy(asc(programRcCatalogueFamilies.code)),
    db.select({ familyCode: programRcCatalogueEntries.familyCode }).from(programRcCatalogueEntries).where(and(eq(programRcCatalogueEntries.accountId, accountId), isNull(programRcCatalogueEntries.deletedAt))),
  ]);
  const activityCounts = new Map<string, number>();
  for (const activity of activities) activityCounts.set(activity.familyCode, (activityCounts.get(activity.familyCode) ?? 0) + 1);
  return families.map((family: any) => ({ id: family.id, code: family.code, label: family.label, activityCount: activityCounts.get(family.code) ?? 0 }));
}

async function getActiveCustomEntries(db: any, accountId: number): Promise<EffectiveRcEntry[]> {
  const [families, entries] = await Promise.all([
    db.select({ code: programRcCatalogueFamilies.code }).from(programRcCatalogueFamilies).where(and(eq(programRcCatalogueFamilies.accountId, accountId), isNull(programRcCatalogueFamilies.deletedAt))),
    db.select({ activityCode: programRcCatalogueEntries.activityCode, familyCode: programRcCatalogueEntries.familyCode, label: programRcCatalogueEntries.label }).from(programRcCatalogueEntries).where(and(eq(programRcCatalogueEntries.accountId, accountId), isNull(programRcCatalogueEntries.deletedAt))).orderBy(asc(programRcCatalogueEntries.activityCode)),
  ]);
  const activeFamilies = new Set(families.map((family: any) => family.code));
  return entries.filter((entry: any) => activeFamilies.has(entry.familyCode)).map((entry: any) => ({ code: entry.activityCode, familyCode: entry.familyCode, label: entry.label }));
}

export async function getEffectiveRcCatalogueEntries(db: any, accountId: number): Promise<EffectiveRcEntry[]> {
  if (await catalogueIsMaterialized(db, accountId)) return getActiveCustomEntries(db, accountId);
  return registreCommerceActivities.map(activity => ({ ...activity, familyCode: activity.code.slice(0, 3) }));
}

export async function getRcCatalogueSummary(db: any, accountId: number) {
  if (!(await catalogueIsMaterialized(db, accountId))) return { source: "catalogue de référence", sourceFilename: null, importedAt: null, activityCount: registreCommerceActivities.length, familyCount: registreCommerceFamilies.length, isCustom: false };
  const [latest] = await db.select({ sourceFilename: programRcCatalogueEntries.sourceFilename, importedAt: programRcCatalogueEntries.importedAt }).from(programRcCatalogueEntries).where(eq(programRcCatalogueEntries.accountId, accountId)).orderBy(desc(programRcCatalogueEntries.importedAt)).limit(1);
  const [families, activities] = await Promise.all([getActiveCustomFamilies(db, accountId), getActiveCustomEntries(db, accountId)]);
  return { source: "catalogue du cabinet", sourceFilename: latest?.sourceFilename ?? REFERENCE_SOURCE, importedAt: latest?.importedAt ?? null, activityCount: activities.length, familyCount: families.length, isCustom: true };
}

export async function getRcCatalogueFamilies(db: any, accountId: number): Promise<RcCatalogueFamily[]> {
  if (!(await catalogueIsMaterialized(db, accountId))) return Array.from(registreCommerceFamilies);
  return getActiveCustomFamilies(db, accountId);
}

export async function getRcCatalogueActivities(db: any, accountId: number, familyCode: string): Promise<RcCatalogueActivity[]> {
  if (!(await catalogueIsMaterialized(db, accountId))) return activitiesForRegistreCommerceFamily(familyCode);
  const family = (await db.select({ id: programRcCatalogueFamilies.id }).from(programRcCatalogueFamilies).where(and(eq(programRcCatalogueFamilies.accountId, accountId), eq(programRcCatalogueFamilies.code, familyCode), isNull(programRcCatalogueFamilies.deletedAt))).limit(1))[0];
  if (!family) return [];
  return db.select({ id: programRcCatalogueEntries.id, code: programRcCatalogueEntries.activityCode, label: programRcCatalogueEntries.label }).from(programRcCatalogueEntries).where(and(eq(programRcCatalogueEntries.accountId, accountId), eq(programRcCatalogueEntries.familyCode, familyCode), isNull(programRcCatalogueEntries.deletedAt))).orderBy(asc(programRcCatalogueEntries.activityCode));
}

export async function resolveRcActivityForAccount(db: any, accountId: number, familyCode: string, activityCode: string) {
  if (!familyCode || !activityCode) throw new Error("Choisissez une catégorie et une activité RC.");
  const activity = (await getRcCatalogueActivities(db, accountId, familyCode)).find(entry => entry.code === activityCode);
  if (!activity) throw new Error("Choisissez une activité valide de votre catalogue RC.");
  return activity;
}

async function assertActiveClientReferencesAllowed(db: any, accountId: number, allowedEntries: readonly EffectiveRcEntry[]) {
  const used = await db.select({ familyCode: clients.rcActivityFamily, activityCode: clients.rcActivityCode }).from(clients).where(and(eq(clients.accountId, accountId), eq(clients.activityKind, "Registre de commerce"), isNull(clients.deletedAt)));
  const allowed = new Set(allowedEntries.map(entry => `${entry.familyCode}:${entry.code}`));
  const invalidCount = used.filter((entry: any) => !allowed.has(`${entry.familyCode}:${entry.activityCode}`)).length;
  if (invalidCount) throw new Error(`${invalidCount} dossier(s) utilisent une activité absente du catalogue. Conservez-la ou modifiez d’abord ces dossiers.`);
}

async function writeRcCatalogue(db: any, accountId: number, sourceFilename: string, rawEntries: readonly RcCatalogueEntryInput[]) {
  const entries = normalizeRcCatalogueEntries(rawEntries);
  const filename = sourceFilename.trim().slice(0, 255);
  if (!/\.(xlsx|xls|xlsb|csv)$/i.test(filename)) throw new Error("Importez uniquement un fichier Excel ou CSV de nomenclature RC.");
  await assertActiveClientReferencesAllowed(db, accountId, entries);
  const families = rcFamiliesFromEntries(entries);
  await db.transaction(async (tx: any) => {
    await tx.delete(programRcCatalogueEntries).where(eq(programRcCatalogueEntries.accountId, accountId));
    await tx.delete(programRcCatalogueFamilies).where(eq(programRcCatalogueFamilies.accountId, accountId));
    await tx.insert(programRcCatalogueFamilies).values(families.map(family => ({ accountId, code: family.code, label: family.label, sourceFilename: filename })));
    await tx.insert(programRcCatalogueEntries).values(entries.map(entry => ({ accountId, familyCode: entry.familyCode, activityCode: entry.code, label: entry.label, sourceFilename: filename })));
  });
  return { activityCount: entries.length, familyCount: families.length, sourceFilename: filename };
}

export async function replaceRcCatalogueFromExcel(db: any, accountId: number, sourceFilename: string, rawEntries: readonly RcCatalogueEntryInput[]) { return writeRcCatalogue(db, accountId, sourceFilename, rawEntries); }
export async function mergeRcCatalogueFromExcel(db: any, accountId: number, sourceFilename: string, rawEntries: readonly RcCatalogueEntryInput[]) {
  const current = await getEffectiveRcCatalogueEntries(db, accountId);
  const merged = new Map(current.map(entry => [entry.code, { code: entry.code, label: entry.label }]));
  for (const entry of normalizeRcCatalogueEntries(rawEntries)) merged.set(entry.code, { code: entry.code, label: entry.label });
  return writeRcCatalogue(db, accountId, sourceFilename, Array.from(merged.values()));
}
export async function resetRcCatalogueToReference(db: any, accountId: number) { await assertActiveClientReferencesAllowed(db, accountId, registreCommerceActivities.map(activity => ({ ...activity, familyCode: activity.code.slice(0, 3) }))); await db.transaction(async (tx: any) => { await tx.delete(programRcCatalogueEntries).where(eq(programRcCatalogueEntries.accountId, accountId)); await tx.delete(programRcCatalogueFamilies).where(eq(programRcCatalogueFamilies.accountId, accountId)); }); return { success: true as const }; }

export async function createRcFamily(db: any, accountId: number, code: string, label: string) {
  await materializeReferenceCatalogue(db, accountId);
  if (!/^\d{3}$/.test(code)) throw new Error("Le code de catégorie RC doit comporter trois chiffres.");
  const normalizedLabel = label.trim().replace(/\s+/g, " ");
  if (normalizedLabel.length < 2 || normalizedLabel.length > 180) throw new Error("Le libellé de catégorie est invalide.");
  const existing = (await db.select().from(programRcCatalogueFamilies).where(and(eq(programRcCatalogueFamilies.accountId, accountId), eq(programRcCatalogueFamilies.code, code))).limit(1))[0];
  if (existing?.deletedAt) { await db.update(programRcCatalogueFamilies).set({ label: normalizedLabel, deletedAt: null, purgeAfter: null }).where(eq(programRcCatalogueFamilies.id, existing.id)); return { id: existing.id, code, label: normalizedLabel }; }
  if (existing) throw new Error("Cette catégorie RC existe déjà.");
  const inserted = await db.insert(programRcCatalogueFamilies).values({ accountId, code, label: normalizedLabel, sourceFilename: "Ajout manuel du cabinet" });
  return { id: Number(inserted[0]?.insertId), code, label: normalizedLabel };
}

export async function updateRcFamily(db: any, accountId: number, id: number, label: string) {
  await materializeReferenceCatalogue(db, accountId);
  const normalizedLabel = label.trim().replace(/\s+/g, " ");
  if (normalizedLabel.length < 2 || normalizedLabel.length > 180) throw new Error("Le libellé de catégorie est invalide.");
  const family = (await db.select().from(programRcCatalogueFamilies).where(and(eq(programRcCatalogueFamilies.id, id), eq(programRcCatalogueFamilies.accountId, accountId), isNull(programRcCatalogueFamilies.deletedAt))).limit(1))[0];
  if (!family) throw new Error("Catégorie RC introuvable.");
  await db.update(programRcCatalogueFamilies).set({ label: normalizedLabel }).where(and(eq(programRcCatalogueFamilies.id, id), eq(programRcCatalogueFamilies.accountId, accountId)));
  return { id, code: family.code, label: normalizedLabel };
}

export async function archiveRcFamily(db: any, accountId: number, id: number) {
  await materializeReferenceCatalogue(db, accountId);
  const family = (await db.select().from(programRcCatalogueFamilies).where(and(eq(programRcCatalogueFamilies.id, id), eq(programRcCatalogueFamilies.accountId, accountId), isNull(programRcCatalogueFamilies.deletedAt))).limit(1))[0];
  if (!family) throw new Error("Catégorie RC introuvable.");
  const [used] = await db.select({ value: count() }).from(clients).where(and(eq(clients.accountId, accountId), eq(clients.rcActivityFamily, family.code), eq(clients.activityKind, "Registre de commerce"), isNull(clients.deletedAt)));
  if (Number(used?.value ?? 0)) throw new Error("Cette catégorie est utilisée par un dossier et ne peut pas être retirée.");
  const now = new Date(); const purgeAfter = purgeAfterThirtyDays();
  await db.transaction(async (tx: any) => { await tx.update(programRcCatalogueFamilies).set({ deletedAt: now, purgeAfter }).where(eq(programRcCatalogueFamilies.id, id)); await tx.update(programRcCatalogueEntries).set({ deletedAt: now, purgeAfter }).where(and(eq(programRcCatalogueEntries.accountId, accountId), eq(programRcCatalogueEntries.familyCode, family.code), isNull(programRcCatalogueEntries.deletedAt))); });
  return { success: true as const };
}

export async function createRcActivity(db: any, accountId: number, familyCode: string, code: string, label: string) {
  await materializeReferenceCatalogue(db, accountId);
  if (!/^\d{3}$/.test(familyCode) || !/^\d{6}$/.test(code) || !code.startsWith(familyCode)) throw new Error("Le code activité RC doit commencer par le code de catégorie et comporter six chiffres.");
  const family = (await db.select({ id: programRcCatalogueFamilies.id }).from(programRcCatalogueFamilies).where(and(eq(programRcCatalogueFamilies.accountId, accountId), eq(programRcCatalogueFamilies.code, familyCode), isNull(programRcCatalogueFamilies.deletedAt))).limit(1))[0];
  if (!family) throw new Error("Choisissez une catégorie RC active.");
  const normalizedLabel = label.trim().replace(/\s+/g, " ");
  if (normalizedLabel.length < 2 || normalizedLabel.length > 320) throw new Error("Le libellé de l’activité est invalide.");
  const existing = (await db.select().from(programRcCatalogueEntries).where(and(eq(programRcCatalogueEntries.accountId, accountId), eq(programRcCatalogueEntries.activityCode, code))).limit(1))[0];
  if (existing?.deletedAt) { await db.update(programRcCatalogueEntries).set({ familyCode, label: normalizedLabel, deletedAt: null, purgeAfter: null }).where(eq(programRcCatalogueEntries.id, existing.id)); return { id: existing.id, code, label: normalizedLabel }; }
  if (existing) throw new Error("Cette activité RC existe déjà.");
  const inserted = await db.insert(programRcCatalogueEntries).values({ accountId, familyCode, activityCode: code, label: normalizedLabel, sourceFilename: "Ajout manuel du cabinet" });
  return { id: Number(inserted[0]?.insertId), code, label: normalizedLabel };
}

export async function updateRcActivity(db: any, accountId: number, id: number, label: string) {
  await materializeReferenceCatalogue(db, accountId);
  const normalizedLabel = label.trim().replace(/\s+/g, " ");
  if (normalizedLabel.length < 2 || normalizedLabel.length > 320) throw new Error("Le libellé de l’activité est invalide.");
  const activity = (await db.select().from(programRcCatalogueEntries).where(and(eq(programRcCatalogueEntries.id, id), eq(programRcCatalogueEntries.accountId, accountId), isNull(programRcCatalogueEntries.deletedAt))).limit(1))[0];
  if (!activity) throw new Error("Activité RC introuvable.");
  await db.transaction(async (tx: any) => { await tx.update(programRcCatalogueEntries).set({ label: normalizedLabel }).where(eq(programRcCatalogueEntries.id, id)); await tx.update(clients).set({ activity: `Registre de commerce — ${normalizedLabel}`.slice(0, 220) }).where(and(eq(clients.accountId, accountId), eq(clients.rcActivityFamily, activity.familyCode), eq(clients.rcActivityCode, activity.activityCode), isNull(clients.deletedAt))); });
  return { id, code: activity.activityCode, label: normalizedLabel };
}

export async function archiveRcActivity(db: any, accountId: number, id: number) {
  await materializeReferenceCatalogue(db, accountId);
  const activity = (await db.select().from(programRcCatalogueEntries).where(and(eq(programRcCatalogueEntries.id, id), eq(programRcCatalogueEntries.accountId, accountId), isNull(programRcCatalogueEntries.deletedAt))).limit(1))[0];
  if (!activity) throw new Error("Activité RC introuvable.");
  const [used] = await db.select({ value: count() }).from(clients).where(and(eq(clients.accountId, accountId), eq(clients.rcActivityFamily, activity.familyCode), eq(clients.rcActivityCode, activity.activityCode), eq(clients.activityKind, "Registre de commerce"), isNull(clients.deletedAt)));
  if (Number(used?.value ?? 0)) throw new Error("Cette activité est utilisée par un dossier et ne peut pas être retirée.");
  await db.update(programRcCatalogueEntries).set({ deletedAt: new Date(), purgeAfter: purgeAfterThirtyDays() }).where(eq(programRcCatalogueEntries.id, id));
  return { success: true as const };
}

export async function listArchivedRcCatalogueItems(db: any, accountId: number) {
  const [families, activities] = await Promise.all([
    db.select({ id: programRcCatalogueFamilies.id, code: programRcCatalogueFamilies.code, label: programRcCatalogueFamilies.label, deletedAt: programRcCatalogueFamilies.deletedAt, purgeAfter: programRcCatalogueFamilies.purgeAfter }).from(programRcCatalogueFamilies).where(and(eq(programRcCatalogueFamilies.accountId, accountId), isNotNull(programRcCatalogueFamilies.deletedAt))),
    db.select({ id: programRcCatalogueEntries.id, code: programRcCatalogueEntries.activityCode, familyCode: programRcCatalogueEntries.familyCode, label: programRcCatalogueEntries.label, deletedAt: programRcCatalogueEntries.deletedAt, purgeAfter: programRcCatalogueEntries.purgeAfter }).from(programRcCatalogueEntries).where(and(eq(programRcCatalogueEntries.accountId, accountId), isNotNull(programRcCatalogueEntries.deletedAt))),
  ]);
  return { families, activities };
}

export async function restoreRcFamily(db: any, accountId: number, id: number) {
  const family = (await db.select().from(programRcCatalogueFamilies).where(and(eq(programRcCatalogueFamilies.id, id), eq(programRcCatalogueFamilies.accountId, accountId), isNotNull(programRcCatalogueFamilies.deletedAt))).limit(1))[0];
  if (!family) throw new Error("Catégorie RC archivée introuvable.");
  await db.transaction(async (tx: any) => {
    await tx.update(programRcCatalogueFamilies).set({ deletedAt: null, purgeAfter: null }).where(eq(programRcCatalogueFamilies.id, id));
    await tx.update(programRcCatalogueEntries).set({ deletedAt: null, purgeAfter: null }).where(and(eq(programRcCatalogueEntries.accountId, accountId), eq(programRcCatalogueEntries.familyCode, family.code)));
  });
  return { success: true as const };
}

export async function restoreRcActivity(db: any, accountId: number, id: number) {
  const activity = (await db.select().from(programRcCatalogueEntries).where(and(eq(programRcCatalogueEntries.id, id), eq(programRcCatalogueEntries.accountId, accountId), isNotNull(programRcCatalogueEntries.deletedAt))).limit(1))[0];
  if (!activity) throw new Error("Activité RC archivée introuvable.");
  const family = (await db.select({ id: programRcCatalogueFamilies.id }).from(programRcCatalogueFamilies).where(and(eq(programRcCatalogueFamilies.accountId, accountId), eq(programRcCatalogueFamilies.code, activity.familyCode), isNull(programRcCatalogueFamilies.deletedAt))).limit(1))[0];
  if (!family) throw new Error("Restaurez d’abord la catégorie RC associée.");
  await db.update(programRcCatalogueEntries).set({ deletedAt: null, purgeAfter: null }).where(eq(programRcCatalogueEntries.id, id));
  return { success: true as const };
}

export async function updateRcFamilyByCode(db: any, accountId: number, code: string, label: string) {
  await materializeReferenceCatalogue(db, accountId);
  const family = (await db.select({ id: programRcCatalogueFamilies.id }).from(programRcCatalogueFamilies).where(and(eq(programRcCatalogueFamilies.accountId, accountId), eq(programRcCatalogueFamilies.code, code), isNull(programRcCatalogueFamilies.deletedAt))).limit(1))[0];
  if (!family) throw new Error("Catégorie RC introuvable.");
  return updateRcFamily(db, accountId, family.id, label);
}

export async function archiveRcFamilyByCode(db: any, accountId: number, code: string) {
  await materializeReferenceCatalogue(db, accountId);
  const family = (await db.select({ id: programRcCatalogueFamilies.id }).from(programRcCatalogueFamilies).where(and(eq(programRcCatalogueFamilies.accountId, accountId), eq(programRcCatalogueFamilies.code, code), isNull(programRcCatalogueFamilies.deletedAt))).limit(1))[0];
  if (!family) throw new Error("Catégorie RC introuvable.");
  return archiveRcFamily(db, accountId, family.id);
}

export async function updateRcActivityByCode(db: any, accountId: number, code: string, label: string) {
  await materializeReferenceCatalogue(db, accountId);
  const activity = (await db.select({ id: programRcCatalogueEntries.id }).from(programRcCatalogueEntries).where(and(eq(programRcCatalogueEntries.accountId, accountId), eq(programRcCatalogueEntries.activityCode, code), isNull(programRcCatalogueEntries.deletedAt))).limit(1))[0];
  if (!activity) throw new Error("Activité RC introuvable.");
  return updateRcActivity(db, accountId, activity.id, label);
}

export async function archiveRcActivityByCode(db: any, accountId: number, code: string) {
  await materializeReferenceCatalogue(db, accountId);
  const activity = (await db.select({ id: programRcCatalogueEntries.id }).from(programRcCatalogueEntries).where(and(eq(programRcCatalogueEntries.accountId, accountId), eq(programRcCatalogueEntries.activityCode, code), isNull(programRcCatalogueEntries.deletedAt))).limit(1))[0];
  if (!activity) throw new Error("Activité RC introuvable.");
  return archiveRcActivity(db, accountId, activity.id);
}
