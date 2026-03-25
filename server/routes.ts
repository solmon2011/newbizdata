import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage, db } from "./storage";
import { entityQuerySchema, entities } from "@shared/schema";
import { sql, and } from "drizzle-orm";
import {
  stripe,
  ensureStripeProducts,
  createCheckoutSession,
  createPortalSession,
} from "./stripe";
import { seedTemplates } from "./templates";
import { sendPostcard, renderTemplate, isLobConfigured } from "./lob";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Initialize Stripe products/prices on startup
  await ensureStripeProducts();

  // Create campaign tables and seed templates
  db.run(sql`CREATE TABLE IF NOT EXISTS campaign_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    thumbnail_url TEXT,
    front_html TEXT NOT NULL,
    back_html TEXT NOT NULL,
    is_system INTEGER DEFAULT 1,
    size TEXT DEFAULT '6x9'
  )`);
  db.run(sql`CREATE TABLE IF NOT EXISTS campaigns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    template_id INTEGER NOT NULL,
    states TEXT NOT NULL,
    entity_types TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    custom_fields TEXT NOT NULL,
    return_address TEXT NOT NULL,
    total_sent INTEGER DEFAULT 0,
    total_cost INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT 'now'
  )`);
  db.run(sql`CREATE TABLE IF NOT EXISTS mail_pieces (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id INTEGER NOT NULL,
    entity_id INTEGER NOT NULL,
    lob_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    cost_cents INTEGER,
    sent_at TEXT,
    delivered_at TEXT
  )`);
  await seedTemplates();

  // ── Stripe Webhook (uses raw body for signature verification) ──
  app.post("/api/webhook", express.raw({ type: "application/json" }), async (req, res) => {
    const sig = req.headers["stripe-signature"] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event: import("stripe").Stripe.Event;

    try {
      if (webhookSecret && sig) {
        const body = (req as any).rawBody || req.body;
        event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
      } else {
        event = req.body as import("stripe").Stripe.Event;
      }
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      return res.status(400).json({ error: `Webhook error: ${err.message}` });
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as import("stripe").Stripe.Checkout.Session;
        const email = session.customer_details?.email;
        if (!email) break;

        let user = storage.getUserByEmail(email);
        if (!user) {
          user = storage.createUser({
            email,
            password: "",
            name: session.customer_details?.name || undefined,
          });
        }

        const statesStr = session.metadata?.states || "";
        const allStates = session.metadata?.allStates === "true";
        const stripeSubId = (session.subscription as string) || undefined;

        if (allStates) {
          const allStateCodes = [
            "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
            "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
            "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
            "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
            "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
          ];
          for (const st of allStateCodes) {
            storage.createSubscription({
              userId: user.id,
              state: st,
              status: "active",
              stripeSubscriptionId: stripeSubId,
            });
          }
        } else if (statesStr) {
          const purchasedStates = statesStr.split(",").filter(Boolean);
          for (const st of purchasedStates) {
            storage.createSubscription({
              userId: user.id,
              state: st,
              status: "active",
              stripeSubscriptionId: stripeSubId,
            });
          }
        }

        console.log(`Checkout completed: ${email}, states: ${allStates ? "ALL" : statesStr}`);
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as import("stripe").Stripe.Subscription;
        if (sub.status === "canceled" || sub.status === "past_due" || sub.status === "unpaid") {
          const rows = storage.getSubscriptionsByStripeId(sub.id);
          for (const row of rows) {
            storage.updateSubscriptionStatus(row.id, "cancelled");
          }
          console.log(`Subscription ${sub.id} status changed to ${sub.status}`);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as import("stripe").Stripe.Subscription;
        const rows = storage.getSubscriptionsByStripeId(sub.id);
        for (const row of rows) {
          storage.updateSubscriptionStatus(row.id, "cancelled");
        }
        console.log(`Subscription ${sub.id} deleted`);
        break;
      }
    }

    return res.json({ received: true });
  });

  // ── Stripe Checkout ────────────────────────────────────
  app.post("/api/checkout", async (req, res) => {
    try {
      const { states, annual, allStates } = req.body as {
        states: string[];
        annual: boolean;
        allStates: boolean;
      };

      if (!allStates && (!states || states.length === 0)) {
        return res.status(400).json({ error: "Select at least one state" });
      }

      const url = await createCheckoutSession({ states: states || [], annual, allStates });
      return res.json({ url });
    } catch (err: any) {
      console.error("Checkout error:", err);
      return res.status(500).json({ error: "Failed to create checkout session" });
    }
  });

  // ── Stripe Billing Portal ──────────────────────────────
  app.post("/api/portal", async (req, res) => {
    try {
      const { customerId } = req.body as { customerId: string };
      if (!customerId) {
        return res.status(400).json({ error: "customerId is required" });
      }

      const url = await createPortalSession(customerId);
      return res.json({ url });
    } catch (err: any) {
      console.error("Portal error:", err);
      return res.status(500).json({ error: "Failed to create portal session" });
    }
  });

  // ── Entity search / list ─────────────────────────────
  app.get("/api/entities", (req, res) => {
    try {
      const parsed = entityQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid query parameters", details: parsed.error.flatten() });
      }

      const allowedStates = undefined; // Demo mode: show all

      const result = storage.queryEntities(parsed.data, allowedStates);

      return res.json({
        data: result.data,
        total: result.total,
        page: parsed.data.page,
        limit: parsed.data.limit,
        totalPages: Math.ceil(result.total / parsed.data.limit),
      });
    } catch (err: any) {
      console.error("Entity query error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // ── Single entity detail ─────────────────────────────
  app.get("/api/entities/:id", (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const entity = storage.getEntityById(id);
    if (!entity) return res.status(404).json({ error: "Entity not found" });

    return res.json(entity);
  });

  // ── Dashboard stats ──────────────────────────────────
  app.get("/api/stats", (_req, res) => {
    try {
      const stats = storage.getEntityStats();
      return res.json(stats);
    } catch (err: any) {
      console.error("Stats error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // ── Filter options ───────────────────────────────────
  app.get("/api/filters", (_req, res) => {
    try {
      const states = storage.getDistinctStates();
      const entityTypes = storage.getDistinctEntityTypes();
      return res.json({ states, entityTypes });
    } catch (err: any) {
      console.error("Filters error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // ── CSV export (must be before :id route) ───────────
  app.get("/api/export/csv", (req, res) => {
    try {
      const parsed = entityQuerySchema.safeParse({ ...req.query, limit: 100, page: 1 });
      if (parsed.success) {
        parsed.data.limit = 10000;
        parsed.data.page = 1;
      }
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid query parameters" });
      }

      const result = storage.queryEntities(parsed.data);

      const headers = ["Name", "Type", "State", "Filing Date", "City", "County", "Zip", "Address", "Contact", "Email", "Phone", "NAICS", "Status"];
      const rows = result.data.map(e => [
        e.name, e.entityType, e.state, e.filingDate, e.city, e.county,
        e.zipCode, e.address, e.contactName, e.email, e.phone, e.naicsCode, e.status,
      ].map(v => `"${(v || "").replace(/"/g, '""')}"`).join(","));

      const csv = [headers.join(","), ...rows].join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename=everynewcustomer-export-${new Date().toISOString().slice(0, 10)}.csv`);
      return res.send(csv);
    } catch (err: any) {
      console.error("CSV export error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // ═══════════════════════════════════════════════════════
  // CAMPAIGN / DIRECT MAIL ROUTES
  // ═══════════════════════════════════════════════════════

  // ── Templates ─────────────────────────────────────────
  app.get("/api/templates", (_req, res) => {
    try {
      const templates = storage.getAllTemplates();
      return res.json(templates);
    } catch (err: any) {
      console.error("Templates error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/templates/:id", (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const template = storage.getTemplateById(id);
    if (!template) return res.status(404).json({ error: "Template not found" });

    return res.json(template);
  });

  // ── Campaigns ─────────────────────────────────────────
  app.post("/api/campaigns", (req, res) => {
    try {
      const { name, templateId, states, entityTypes, customFields, returnAddress, status } = req.body;

      if (!name || !templateId || !states || !customFields || !returnAddress) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Create a demo user if none exists (no auth yet)
      let user = storage.getUserByEmail("demo@everynewcustomer.com");
      if (!user) {
        user = storage.createUser({ email: "demo@everynewcustomer.com", password: "", name: "Demo User" });
      }

      const campaign = storage.createCampaign({
        userId: user.id,
        name,
        templateId,
        states: typeof states === "string" ? states : JSON.stringify(states),
        entityTypes: entityTypes ? (typeof entityTypes === "string" ? entityTypes : JSON.stringify(entityTypes)) : null,
        status: status || "draft",
        customFields: typeof customFields === "string" ? customFields : JSON.stringify(customFields),
        returnAddress: typeof returnAddress === "string" ? returnAddress : JSON.stringify(returnAddress),
      });

      return res.json(campaign);
    } catch (err: any) {
      console.error("Create campaign error:", err);
      return res.status(500).json({ error: "Failed to create campaign" });
    }
  });

  app.get("/api/campaigns", (_req, res) => {
    try {
      const allCampaigns = storage.getCampaigns();
      return res.json(allCampaigns);
    } catch (err: any) {
      console.error("List campaigns error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/campaigns/:id", (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const campaign = storage.getCampaignById(id);
    if (!campaign) return res.status(404).json({ error: "Campaign not found" });

    const stats = storage.getMailPieceStats(id);
    const template = storage.getTemplateById(campaign.templateId);

    return res.json({ ...campaign, mailStats: stats, template });
  });

  app.patch("/api/campaigns/:id", (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const campaign = storage.getCampaignById(id);
    if (!campaign) return res.status(404).json({ error: "Campaign not found" });

    const allowed = ["name", "status", "customFields", "returnAddress", "states", "entityTypes"];
    const updates: any = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        const val = req.body[key];
        updates[key] = typeof val === "object" ? JSON.stringify(val) : val;
      }
    }

    storage.updateCampaign(id, updates);
    const updated = storage.getCampaignById(id);
    return res.json(updated);
  });

  // ── Preview ───────────────────────────────────────────
  app.post("/api/campaigns/:id/preview", (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const campaign = storage.getCampaignById(id);
    if (!campaign) return res.status(404).json({ error: "Campaign not found" });

    const template = storage.getTemplateById(campaign.templateId);
    if (!template) return res.status(404).json({ error: "Template not found" });

    const customFields = JSON.parse(campaign.customFields);
    const vars: Record<string, string> = {
      company_name: customFields.company_name || "",
      phone: customFields.phone || "",
      email: customFields.email || "",
      website: customFields.website || "",
      headline: customFields.headline || "",
      offer: customFields.offer || "",
      business_name: "[New Business Name]",
    };

    return res.json({
      frontHtml: renderTemplate(template.frontHtml, vars),
      backHtml: renderTemplate(template.backHtml, vars),
    });
  });

  // Preview with inline fields (before campaign is saved)
  app.post("/api/templates/:id/preview", (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const template = storage.getTemplateById(id);
    if (!template) return res.status(404).json({ error: "Template not found" });

    const { customFields } = req.body;
    const fields = typeof customFields === "string" ? JSON.parse(customFields) : (customFields || {});
    const vars: Record<string, string> = {
      company_name: fields.company_name || "",
      phone: fields.phone || "",
      email: fields.email || "",
      website: fields.website || "",
      headline: fields.headline || "",
      offer: fields.offer || "",
      business_name: "[New Business Name]",
    };

    return res.json({
      frontHtml: renderTemplate(template.frontHtml, vars),
      backHtml: renderTemplate(template.backHtml, vars),
    });
  });

  // ── Send test ─────────────────────────────────────────
  app.post("/api/campaigns/:id/send-test", async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const campaign = storage.getCampaignById(id);
    if (!campaign) return res.status(404).json({ error: "Campaign not found" });

    const template = storage.getTemplateById(campaign.templateId);
    if (!template) return res.status(404).json({ error: "Template not found" });

    const { address } = req.body;
    if (!address) return res.status(400).json({ error: "Test address is required" });

    const customFields = JSON.parse(campaign.customFields);
    const returnAddr = JSON.parse(campaign.returnAddress);

    try {
      const result = await sendPostcard({
        to: address,
        from: {
          name: returnAddr.name,
          address_line1: returnAddr.address_line1,
          address_city: returnAddr.city,
          address_state: returnAddr.state,
          address_zip: returnAddr.zip,
        },
        frontHtml: template.frontHtml,
        backHtml: template.backHtml,
        size: template.size || "6x9",
        mergeVariables: {
          company_name: customFields.company_name || "",
          phone: customFields.phone || "",
          email: customFields.email || "",
          website: customFields.website || "",
          headline: customFields.headline || "",
          offer: customFields.offer || "",
          business_name: address.name || "Test Business",
        },
      });

      return res.json({ success: true, lobId: result?.id, url: result?.url });
    } catch (err: any) {
      console.error("Send test error:", err);
      return res.status(500).json({ error: "Failed to send test postcard" });
    }
  });

  // ── Mail pieces ──────────────────────────────────────
  app.get("/api/campaigns/:id/mail-pieces", (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 25));

    const result = storage.getMailPiecesByCampaign(id, page, limit);
    return res.json({
      ...result,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit),
    });
  });

  // ── Execute campaign (manual trigger) ─────────────────
  app.post("/api/campaigns/:id/execute", async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const campaign = storage.getCampaignById(id);
    if (!campaign) return res.status(404).json({ error: "Campaign not found" });
    if (campaign.status !== "active") return res.status(400).json({ error: "Campaign must be active to execute" });

    const template = storage.getTemplateById(campaign.templateId);
    if (!template) return res.status(404).json({ error: "Template not found" });

    const customFields = JSON.parse(campaign.customFields);
    const returnAddr = JSON.parse(campaign.returnAddress);
    const targetStates: string[] = JSON.parse(campaign.states);
    const targetEntityTypes: string[] | null = campaign.entityTypes ? JSON.parse(campaign.entityTypes) : null;

    const alreadySent = new Set(storage.getAlreadySentEntityIds(id));

    const conditions: any[] = [];
    if (targetStates.length > 0) {
      conditions.push(
        sql`${entities.state} IN (${sql.join(targetStates.map(s => sql`${s}`), sql`, `)})`
      );
    }
    if (targetEntityTypes && targetEntityTypes.length > 0) {
      conditions.push(
        sql`${entities.entityType} IN (${sql.join(targetEntityTypes.map(t => sql`${t}`), sql`, `)})`
      );
    }
    conditions.push(sql`${entities.address} IS NOT NULL AND ${entities.address} != ''`);

    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const matchingEntities = db.select().from(entities).where(where).limit(100).all();

    let sentCount = 0;
    let totalCostCents = 0;
    const costPerPiece = 70;

    for (const entity of matchingEntities) {
      if (alreadySent.has(entity.id)) continue;

      const mergeVars: Record<string, string> = {
        company_name: customFields.company_name || "",
        phone: customFields.phone || "",
        email: customFields.email || "",
        website: customFields.website || "",
        headline: customFields.headline || "",
        offer: customFields.offer || "",
        business_name: entity.name,
      };

      try {
        const result = await sendPostcard({
          to: {
            name: entity.name,
            address_line1: entity.address || "",
            address_city: entity.city || "",
            address_state: entity.state,
            address_zip: entity.zipCode || "",
          },
          from: {
            name: returnAddr.name,
            address_line1: returnAddr.address_line1,
            address_city: returnAddr.city,
            address_state: returnAddr.state,
            address_zip: returnAddr.zip,
          },
          frontHtml: template.frontHtml,
          backHtml: template.backHtml,
          size: template.size || "6x9",
          mergeVariables: mergeVars,
        });

        storage.createMailPiece({
          campaignId: id,
          entityId: entity.id,
          lobId: result?.id || null,
          status: "mailed",
          costCents: costPerPiece,
          sentAt: new Date().toISOString(),
        });

        sentCount++;
        totalCostCents += costPerPiece;
      } catch (err) {
        console.error(`Failed to send to entity ${entity.id}:`, err);
        storage.createMailPiece({
          campaignId: id,
          entityId: entity.id,
          lobId: null,
          status: "pending",
          costCents: 0,
        });
      }
    }

    if (sentCount > 0) {
      storage.incrementCampaignStats(id, sentCount, totalCostCents);
    }

    return res.json({
      sent: sentCount,
      cost_cents: totalCostCents,
      total_matched: matchingEntities.length,
      skipped_already_sent: matchingEntities.filter(e => alreadySent.has(e.id)).length,
    });
  });

  // ── Estimate volume for campaign targeting ────────────
  app.post("/api/campaigns/estimate", (req, res) => {
    try {
      const { states, entityTypes } = req.body;
      const targetStates: string[] = states || [];
      const targetEntityTypes: string[] | null = entityTypes && entityTypes.length > 0 ? entityTypes : null;

      const conditions: any[] = [];
      if (targetStates.length > 0) {
        conditions.push(
          sql`${entities.state} IN (${sql.join(targetStates.map((s: string) => sql`${s}`), sql`, `)})`
        );
      }
      if (targetEntityTypes && targetEntityTypes.length > 0) {
        conditions.push(
          sql`${entities.entityType} IN (${sql.join(targetEntityTypes.map((t: string) => sql`${t}`), sql`, `)})`
        );
      }
      conditions.push(sql`${entities.address} IS NOT NULL AND ${entities.address} != ''`);

      const where = conditions.length > 0 ? and(...conditions) : undefined;
      const countRow = db.select({ count: sql<number>`count(*)` }).from(entities).where(where).get();

      return res.json({ estimated: countRow?.count ?? 0 });
    } catch (err: any) {
      console.error("Estimate error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  return httpServer;
}
