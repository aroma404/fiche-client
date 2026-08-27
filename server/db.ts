/** Atelier fiscal moderne — accès base de données et opérations sécurisées liées au compte. */
import { and, eq, inArray, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { accounts, cabinetFinanceEntries, clientCashEntries, clientCompliance, clientContacts, clientDocuments, clientFiles, clientPayments, clients, clientWorkCases, InsertUser, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getAccountByEmail(email: string) {
  const db = await getDb();
  if (!db) throw new Error("La base de données est indisponible.");
  const rows = await db.select().from(accounts).where(eq(accounts.email, email)).limit(1);
  return rows[0] ?? null;
}

export async function getAccountById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("La base de données est indisponible.");
  const rows = await db.select().from(accounts).where(eq(accounts.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getOwnedClient(accountId: number, clientId: number) {
  const db = await getDb();
  if (!db) throw new Error("La base de données est indisponible.");
  const rows = await db.select().from(clients).where(and(eq(clients.id, clientId), eq(clients.accountId, accountId))).limit(1);
  return rows[0] ?? null;
}

export async function getClientBundle(accountId: number, clientId: number) {
  const db = await getDb();
  if (!db) throw new Error("La base de données est indisponible.");
  const client = await getOwnedClient(accountId, clientId);
  if (!client) return null;
  const [documents, files, payments, cashEntries, financeEntries, contacts] = await Promise.all([
    db.select().from(clientDocuments).where(and(eq(clientDocuments.clientId, clientId), isNull(clientDocuments.deletedAt))),
    db.select({ id: clientFiles.id, accountId: clientFiles.accountId, clientId: clientFiles.clientId, documentId: clientFiles.documentId, displayName: clientFiles.displayName, category: clientFiles.category, originalName: clientFiles.originalName, mimeType: clientFiles.mimeType, sizeBytes: clientFiles.sizeBytes, createdAt: clientFiles.createdAt, updatedAt: clientFiles.updatedAt }).from(clientFiles).where(and(eq(clientFiles.accountId, accountId), eq(clientFiles.clientId, clientId), isNull(clientFiles.deletedAt))),
    db.select().from(clientPayments).where(eq(clientPayments.clientId, clientId)),
    db.select().from(clientCashEntries).where(eq(clientCashEntries.clientId, clientId)),
    db.select().from(cabinetFinanceEntries).where(and(eq(cabinetFinanceEntries.clientId, clientId), eq(cabinetFinanceEntries.accountId, accountId))),
    db.select().from(clientContacts).where(and(eq(clientContacts.clientId, clientId), isNull(clientContacts.deletedAt))),
  ]);
  return { client, documents, files, payments, cashEntries, financeEntries, contacts };
}

export async function getClientBundles(accountId: number, clientIds?: number[]) {
  const db = await getDb();
  if (!db) throw new Error("La base de données est indisponible.");
  const filter = clientIds?.length ? and(eq(clients.accountId, accountId), inArray(clients.id, clientIds)) : eq(clients.accountId, accountId);
  const owned = await db.select().from(clients).where(filter);
  if (!owned.length) return [];
  const ownedIds = owned.map(client => client.id);
  const [documents, files, payments, cashEntries, financeEntries, contacts] = await Promise.all([
    db.select().from(clientDocuments).where(and(inArray(clientDocuments.clientId, ownedIds), isNull(clientDocuments.deletedAt))),
    db.select({ id: clientFiles.id, accountId: clientFiles.accountId, clientId: clientFiles.clientId, documentId: clientFiles.documentId, displayName: clientFiles.displayName, category: clientFiles.category, originalName: clientFiles.originalName, mimeType: clientFiles.mimeType, sizeBytes: clientFiles.sizeBytes, createdAt: clientFiles.createdAt, updatedAt: clientFiles.updatedAt }).from(clientFiles).where(and(eq(clientFiles.accountId, accountId), inArray(clientFiles.clientId, ownedIds), isNull(clientFiles.deletedAt))),
    db.select().from(clientPayments).where(inArray(clientPayments.clientId, ownedIds)),
    db.select().from(clientCashEntries).where(inArray(clientCashEntries.clientId, ownedIds)),
    db.select().from(cabinetFinanceEntries).where(and(eq(cabinetFinanceEntries.accountId, accountId), inArray(cabinetFinanceEntries.clientId, ownedIds))),
    db.select().from(clientContacts).where(and(inArray(clientContacts.clientId, ownedIds), isNull(clientContacts.deletedAt))),
  ]);
  const groupByClient = <T extends { clientId: number | null }>(rows: T[]) => rows.reduce((groups, row) => {
    if (row.clientId !== null) groups.get(row.clientId)?.push(row) ?? groups.set(row.clientId, [row]);
    return groups;
  }, new Map<number, T[]>());
  const documentsByClient = groupByClient(documents);
  const filesByClient = groupByClient(files);
  const paymentsByClient = groupByClient(payments);
  const cashEntriesByClient = groupByClient(cashEntries);
  const financeEntriesByClient = groupByClient(financeEntries);
  const contactsByClient = groupByClient(contacts);
  return owned.map(client => ({
    client,
    documents: documentsByClient.get(client.id) ?? [],
    files: filesByClient.get(client.id) ?? [],
    payments: paymentsByClient.get(client.id) ?? [],
    cashEntries: cashEntriesByClient.get(client.id) ?? [],
    financeEntries: financeEntriesByClient.get(client.id) ?? [],
    contacts: contactsByClient.get(client.id) ?? [],
  }));
}
