import {
  type User, type InsertUser, users,
  type Subscription, type InsertSubscription, subscriptions,
  type Entity, type InsertEntity, entities,
  type EntityQuery,
} from "@shared/schema";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq, and, or, like, sql, asc, desc } from "drizzle-orm";

const sqlite = new Database("data.db");
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite);

// ── Interface ──────────────────────────────────────────
export interface IStorage {
  // Users
  getUser(id: number): User | undefined;
  getUserByEmail(email: string): User | undefined;
  createUser(user: InsertUser): User;

  // Subscriptions
  getSubscriptionsByUser(userId: number): Subscription[];
  getActiveStatesByUser(userId: number): string[];
  getSubscriptionsByStripeId(stripeSubscriptionId: string): Subscription[];
  createSubscription(sub: InsertSubscription): Subscription;
  updateSubscriptionStatus(id: number, status: string): void;

  // Entities
  queryEntities(query: EntityQuery, allowedStates?: string[]): { data: Entity[]; total: number };
  getEntityById(id: number): Entity | undefined;
  getEntityStats(allowedStates?: string[]): { total: number; states: number; withContact: number };
  getDistinctStates(): string[];
  getDistinctEntityTypes(): string[];
  insertEntities(batch: InsertEntity[]): void;
}

// ── Implementation ─────────────────────────────────────
export class DatabaseStorage implements IStorage {

  // ── Users ──────────────────────────────────────────
  getUser(id: number): User | undefined {
    return db.select().from(users).where(eq(users.id, id)).get();
  }

  getUserByEmail(email: string): User | undefined {
    return db.select().from(users).where(eq(users.email, email)).get();
  }

  createUser(user: InsertUser): User {
    return db.insert(users).values(user).returning().get();
  }

  // ── Subscriptions ──────────────────────────────────
  getSubscriptionsByUser(userId: number): Subscription[] {
    return db.select().from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .all();
  }

  getActiveStatesByUser(userId: number): string[] {
    const rows = db.select({ state: subscriptions.state })
      .from(subscriptions)
      .where(and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.status, "active"),
      ))
      .all();
    return rows.map(r => r.state);
  }

  getSubscriptionsByStripeId(stripeSubscriptionId: string): Subscription[] {
    return db.select().from(subscriptions)
      .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId))
      .all();
  }

  createSubscription(sub: InsertSubscription): Subscription {
    return db.insert(subscriptions).values(sub).returning().get();
  }

  updateSubscriptionStatus(id: number, status: string): void {
    db.update(subscriptions)
      .set({ status })
      .where(eq(subscriptions.id, id))
      .run();
  }

  // ── Entities ───────────────────────────────────────
  queryEntities(query: EntityQuery, allowedStates?: string[]): { data: Entity[]; total: number } {
    const conditions: any[] = [];

    // State access control
    if (allowedStates && allowedStates.length > 0) {
      conditions.push(
        sql`${entities.state} IN (${sql.join(allowedStates.map(s => sql`${s}`), sql`, `)})`
      );
    }

    // Filters
    if (query.state) {
      conditions.push(eq(entities.state, query.state));
    }
    if (query.entityType) {
      conditions.push(eq(entities.entityType, query.entityType));
    }

    // Exclude corporate registered agents
    if (query.excludeRa === "true") {
      conditions.push(eq(entities.isCorporateRa, 0));
    }

    // Search across multiple fields
    if (query.search) {
      const term = `%${query.search}%`;
      conditions.push(
        or(
          like(entities.name, term),
          like(entities.contactName, term),
          like(entities.email, term),
          like(entities.city, term),
          like(entities.naicsCode, term),
        )
      );
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    // Count
    const countRow = db.select({ count: sql<number>`count(*)` })
      .from(entities)
      .where(where)
      .get();
    const total = countRow?.count ?? 0;

    // Sort
    const sortCol = {
      name: entities.name,
      filingDate: entities.filingDate,
      city: entities.city,
      state: entities.state,
      entityType: entities.entityType,
    }[query.sortBy] ?? entities.filingDate;

    const orderFn = query.sortOrder === "asc" ? asc : desc;

    // Paginated results
    const offset = (query.page - 1) * query.limit;
    const data = db.select().from(entities)
      .where(where)
      .orderBy(orderFn(sortCol))
      .limit(query.limit)
      .offset(offset)
      .all();

    return { data, total };
  }

  getEntityById(id: number): Entity | undefined {
    return db.select().from(entities).where(eq(entities.id, id)).get();
  }

  getEntityStats(allowedStates?: string[]): { total: number; states: number; withContact: number; corporateRa: number; ownerContacts: number } {
    const where = allowedStates && allowedStates.length > 0
      ? sql`${entities.state} IN (${sql.join(allowedStates.map(s => sql`${s}`), sql`, `)})`
      : undefined;

    const totalRow = db.select({ count: sql<number>`count(*)` })
      .from(entities).where(where).get();

    const statesRow = db.select({ count: sql<number>`count(distinct ${entities.state})` })
      .from(entities).where(where).get();

    const contactRow = db.select({ count: sql<number>`count(*)` })
      .from(entities)
      .where(where ? and(where, sql`(${entities.email} IS NOT NULL OR ${entities.contactName} IS NOT NULL)`) : sql`(${entities.email} IS NOT NULL OR ${entities.contactName} IS NOT NULL)`)
      .get();

    const raRow = db.select({ count: sql<number>`count(*)` })
      .from(entities)
      .where(where ? and(where, eq(entities.isCorporateRa, 1)) : eq(entities.isCorporateRa, 1))
      .get();

    const ownerRow = db.select({ count: sql<number>`count(*)` })
      .from(entities)
      .where(where ? and(where, sql`${entities.contactName} IS NOT NULL AND ${entities.contactName} != '' AND ${entities.isCorporateRa} = 0`) : sql`contact_name IS NOT NULL AND contact_name != '' AND is_corporate_ra = 0`)
      .get();

    return {
      total: totalRow?.count ?? 0,
      states: statesRow?.count ?? 0,
      withContact: contactRow?.count ?? 0,
      corporateRa: raRow?.count ?? 0,
      ownerContacts: ownerRow?.count ?? 0,
    };
  }

  getDistinctStates(): string[] {
    const rows = db.select({ state: entities.state })
      .from(entities)
      .groupBy(entities.state)
      .all();
    return rows.map(r => r.state).filter(Boolean) as string[];
  }

  getDistinctEntityTypes(): string[] {
    const rows = db.select({ entityType: entities.entityType })
      .from(entities)
      .groupBy(entities.entityType)
      .all();
    return rows.map(r => r.entityType).filter(Boolean) as string[];
  }

  insertEntities(batch: InsertEntity[]): void {
    const CHUNK = 500;
    for (let i = 0; i < batch.length; i += CHUNK) {
      db.insert(entities).values(batch.slice(i, i + CHUNK)).run();
    }
  }
}

export const storage = new DatabaseStorage();
