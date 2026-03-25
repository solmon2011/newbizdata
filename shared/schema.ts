import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ── Users ──────────────────────────────────────────────
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name"),
  createdAt: text("created_at").notNull().default("now"),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// ── Subscriptions ──────────────────────────────────────
export const subscriptions = sqliteTable("subscriptions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  state: text("state").notNull(), // two-letter state code
  status: text("status").notNull().default("active"), // active | cancelled
  stripeSubscriptionId: text("stripe_subscription_id"),
  createdAt: text("created_at").notNull().default("now"),
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({ id: true, createdAt: true });
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptions.$inferSelect;

// ── Business Entities (the core product data) ──────────
export const entities = sqliteTable("entities", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sourceId: text("source_id"),              // original ID from state system
  name: text("name").notNull(),
  entityType: text("entity_type"),          // LLC, Corporation, etc.
  state: text("state").notNull(),           // two-letter state code
  filingDate: text("filing_date"),          // ISO date string
  city: text("city"),
  county: text("county"),
  zipCode: text("zip_code"),
  address: text("address"),
  contactName: text("contact_name"),
  email: text("email"),
  phone: text("phone"),
  naicsCode: text("naics_code"),
  status: text("status"),                   // Active, Good Standing, etc.
  jurisdiction: text("jurisdiction"),
  isCorporateRa: integer("is_corporate_ra").default(0), // 1 = corporate registered agent, not owner
});

export const insertEntitySchema = createInsertSchema(entities).omit({ id: true });
export type InsertEntity = z.infer<typeof insertEntitySchema>;
export type Entity = typeof entities.$inferSelect;

// ── API query params schema ────────────────────────────
export const entityQuerySchema = z.object({
  search: z.string().optional(),
  state: z.string().optional(),
  entityType: z.string().optional(),
  excludeRa: z.enum(["true", "false"]).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(25),
  sortBy: z.enum(["name", "filingDate", "city", "state", "entityType"]).default("filingDate"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});
export type EntityQuery = z.infer<typeof entityQuerySchema>;
