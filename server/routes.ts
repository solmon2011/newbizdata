import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { entityQuerySchema } from "@shared/schema";
import {
  stripe,
  ensureStripeProducts,
  createCheckoutSession,
  createPortalSession,
} from "./stripe";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Initialize Stripe products/prices on startup
  await ensureStripeProducts();

  // ── Stripe Webhook (uses raw body for signature verification) ──
  app.post("/api/webhook", express.raw({ type: "application/json" }), async (req, res) => {
    const sig = req.headers["stripe-signature"] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event: import("stripe").Stripe.Event;

    try {
      if (webhookSecret && sig) {
        // Use rawBody captured by the verify function in index.ts
        const body = (req as any).rawBody || req.body;
        event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
      } else {
        // Dev mode without webhook secret — parse body directly
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

        // Find or create user
        let user = storage.getUserByEmail(email);
        if (!user) {
          user = storage.createUser({
            email,
            password: "", // Stripe-only user, no password login
            name: session.customer_details?.name || undefined,
          });
        }

        // Determine which states were purchased
        const statesStr = session.metadata?.states || "";
        const allStates = session.metadata?.allStates === "true";
        const stripeSubId = (session.subscription as string) || undefined;

        if (allStates) {
          // Activate all 50 states
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
        // Sync subscription status — if cancelled or past_due, update local records
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

      // TODO: In production, get allowedStates from user's subscription
      // const userId = req.session?.userId;
      // const allowedStates = userId ? storage.getActiveStatesByUser(userId) : undefined;
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
      // For CSV export, parse query but override limit/page manually after validation
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

  return httpServer;
}
