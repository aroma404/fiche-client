/** Atelier fiscal moderne — accès base de données et opérations sécurisées liées au compte. */
import { and, eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { accounts, cabinetFinanceEntries, clientCashEntries, clientCompliance, clientDocuments, clientPayments, clients, clientWorkCases, InsertUser, users } from "../drizzle/schema";
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
  const [documents, compliance, cases, payments, cashEntries, financeEntries] = await Promise.all([
    db.select().from(clientDocuments).where(eq(clientDocuments.clientId, clientId)),
    db.select().from(clientCompliance).where(eq(clientCompliance.clientId, clientId)),
    db.select().from(clientWorkCases).where(eq(clientWorkCases.clientId, clientId)),
    db.select().from(clientPayments).where(eq(clientPayments.clientId, clientId)),
    db.select().from(clientCashEntries).where(eq(clientCashEntries.clientId, clientId)),
    db.select().from(cabinetFinanceEntries).where(and(eq(cabinetFinanceEntries.clientId, clientId), eq(cabinetFinanceEntries.accountId, accountId))),
  ]);
  return { client, documents, compliance, cases, payments, cashEntries, financeEntries };
}

export async function getClientBundles(accountId: number, clientIds?: number[]) {
  const db = await getDb();
  if (!db) throw new Error("La base de données est indisponible.");
  const filter = clientIds?.length ? and(eq(clients.accountId, accountId), inArray(clients.id, clientIds)) : eq(clients.accountId, accountId);
  const owned = await db.select().from(clients).where(filter);
  return Promise.all(owned.map(client => getClientBundle(accountId, client.id)));
}
