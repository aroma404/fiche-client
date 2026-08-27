import { and, count, eq, isNull, sql } from "drizzle-orm";
import { cabinetFinanceEntries, clientContacts, clientDocuments, clients, passwordVaultEntries, programClientOptions, programClientStatuses } from "../drizzle/schema";
import { programReferenceRegistry, protectedReferenceChoices, type AccountOptionKind, type ProgramReferenceId } from "../shared/reference-registry";
import { registreCommerceActivities, registreCommerceFamilies } from "../shared/registre-commerce-activities";

export async function countProgramStatusUsage(db: any, accountId: number, label: string) {
  const [result] = await db.select({ value: count() }).from(clients).where(and(eq(clients.accountId, accountId), eq(clients.status, label), isNull(clients.deletedAt)));
  return Number(result?.value ?? 0);
}

export async function countProgramOptionUsage(db: any, accountId: number, kind: AccountOptionKind, label: string) {
  if (kind === "legalForm" || kind === "clientType" || kind === "regime") {
    const column = kind === "legalForm" ? clients.legalForm : kind === "clientType" ? clients.clientType : clients.regime;
    const [result] = await db.select({ value: count() }).from(clients).where(and(eq(clients.accountId, accountId), eq(column, label), isNull(clients.deletedAt)));
    return Number(result?.value ?? 0);
  }
  if (kind === "vaultCategory") {
    const [result] = await db.select({ value: count() }).from(passwordVaultEntries).where(and(eq(passwordVaultEntries.accountId, accountId), eq(passwordVaultEntries.category, label), isNull(passwordVaultEntries.deletedAt)));
    return Number(result?.value ?? 0);
  }
  const [result] = await db.select({ value: count() }).from(clientContacts).innerJoin(clients, eq(clientContacts.clientId, clients.id)).where(and(eq(clients.accountId, accountId), eq(clientContacts.type, label), isNull(clientContacts.deletedAt), isNull(clients.deletedAt)));
  return Number(result?.value ?? 0);
}

async function countUsageForReference(db: any, accountId: number, id: ProgramReferenceId) {
  const countClientField = async (column: any) => {
    const [result] = await db.select({ value: count() }).from(clients).where(and(eq(clients.accountId, accountId), sql`${column} <> ''`, isNull(clients.deletedAt)));
    return Number(result?.value ?? 0);
  };
  if (id === "clientStatus") {
    const [result] = await db.select({ value: count() }).from(clients).where(and(eq(clients.accountId, accountId), isNull(clients.deletedAt)));
    return Number(result?.value ?? 0);
  }
  if (id === "legalForm") return countClientField(clients.legalForm);
  if (id === "clientType") return countClientField(clients.clientType);
  if (id === "regime") return countClientField(clients.regime);
  if (id === "contactType") {
    const [result] = await db.select({ value: count() }).from(clientContacts).innerJoin(clients, eq(clientContacts.clientId, clients.id)).where(and(eq(clients.accountId, accountId), isNull(clientContacts.deletedAt), isNull(clients.deletedAt)));
    return Number(result?.value ?? 0);
  }
  if (id === "vaultCategory") {
    const [result] = await db.select({ value: count() }).from(passwordVaultEntries).where(and(eq(passwordVaultEntries.accountId, accountId), isNull(passwordVaultEntries.deletedAt)));
    return Number(result?.value ?? 0);
  }
  if (id === "activityKind" || id === "autoEntrepreneurActivity" || id === "registreCommerce" || id === "taxCenter") return countClientField(id === "taxCenter" ? clients.taxCenter : id === "autoEntrepreneurActivity" ? clients.autoEntrepreneurActivity : id === "registreCommerce" ? clients.rcActivityCode : clients.activityKind);
  if (id === "documentStatus") { const [result] = await db.select({ value: count() }).from(clientDocuments).innerJoin(clients, eq(clientDocuments.clientId, clients.id)).where(and(eq(clients.accountId, accountId), isNull(clients.deletedAt))); return Number(result?.value ?? 0); }
  if (id === "financeCategory" || id === "financeDirection") { const [result] = await db.select({ value: count() }).from(cabinetFinanceEntries).where(eq(cabinetFinanceEntries.accountId, accountId)); return Number(result?.value ?? 0); }
  return 0;
}

function protectedValueCount(id: ProgramReferenceId) {
  if (id === "registreCommerce") return registreCommerceActivities.length;
  if (id === "activityKind") return protectedReferenceChoices.activityKind.length - 1;
  if (id === "autoEntrepreneurActivity") return protectedReferenceChoices.autoEntrepreneurActivity.length - 1;
  if (id === "taxCenter") return protectedReferenceChoices.taxCenter.length;
  if (id in protectedReferenceChoices) return protectedReferenceChoices[id as keyof typeof protectedReferenceChoices].length;
  return 0;
}

export async function getProgramReferenceSummary(db: any, accountId: number) {
  return Promise.all(programReferenceRegistry.map(async reference => {
    let valueCount = protectedValueCount(reference.id);
    if (reference.id === "clientStatus") {
      const [result] = await db.select({ value: count() }).from(programClientStatuses).where(and(eq(programClientStatuses.accountId, accountId), isNull(programClientStatuses.deletedAt)));
      valueCount = Number(result?.value ?? 0);
    }
    if (reference.optionKind) {
      const [result] = await db.select({ value: count() }).from(programClientOptions).where(and(eq(programClientOptions.accountId, accountId), eq(programClientOptions.kind, reference.optionKind), isNull(programClientOptions.deletedAt)));
      valueCount = Number(result?.value ?? 0);
    }
    const usageCount = await countUsageForReference(db, accountId, reference.id);
    return { ...reference, valueCount, usageCount, catalogueFamilies: reference.id === "registreCommerce" ? registreCommerceFamilies.length : undefined };
  }));
}
