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

// ── Campaign Templates ────────────────────────────────
export const campaignTemplates = sqliteTable("campaign_templates", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category"), // insurance, accounting, real_estate, merchant_services, general, marketing
  thumbnailUrl: text("thumbnail_url"),
  frontHtml: text("front_html").notNull(),
  backHtml: text("back_html").notNull(),
  isSystem: integer("is_system").default(1), // 1 = pre-built, 0 = user-created
  size: text("size").default("6x9"), // 4x6, 6x9, 6x11
});

export const insertCampaignTemplateSchema = createInsertSchema(campaignTemplates).omit({ id: true });
export type InsertCampaignTemplate = z.infer<typeof insertCampaignTemplateSchema>;
export type CampaignTemplate = typeof campaignTemplates.$inferSelect;

// ── Campaigns ─────────────────────────────────────────
export const campaigns = sqliteTable("campaigns", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  templateId: integer("template_id").notNull().references(() => campaignTemplates.id),
  states: text("states").notNull(), // JSON array of state codes
  entityTypes: text("entity_types"), // JSON array or null for all
  status: text("status").notNull().default("draft"), // draft, active, paused
  customFields: text("custom_fields").notNull(), // JSON: {company_name, phone, email, website, headline, offer, logo_url}
  returnAddress: text("return_address").notNull(), // JSON: {name, address_line1, city, state, zip}
  totalSent: integer("total_sent").default(0),
  totalCost: integer("total_cost").default(0), // cents
  createdAt: text("created_at").notNull().default("now"),
});

export const insertCampaignSchema = createInsertSchema(campaigns).omit({ id: true, totalSent: true, totalCost: true, createdAt: true });
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type Campaign = typeof campaigns.$inferSelect;

// ── Mail Pieces ───────────────────────────────────────
export const mailPieces = sqliteTable("mail_pieces", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  campaignId: integer("campaign_id").notNull().references(() => campaigns.id),
  entityId: integer("entity_id").notNull().references(() => entities.id),
  lobId: text("lob_id"),
  status: text("status").notNull().default("pending"), // pending, mailed, delivered, returned
  costCents: integer("cost_cents"),
  sentAt: text("sent_at"),
  deliveredAt: text("delivered_at"),
});

export const insertMailPieceSchema = createInsertSchema(mailPieces).omit({ id: true });
export type InsertMailPiece = z.infer<typeof insertMailPieceSchema>;
export type MailPiece = typeof mailPieces.$inferSelect;
