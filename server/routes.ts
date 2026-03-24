import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { entityQuerySchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

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
      res.setHeader("Content-Disposition", `attachment; filename=newbizdata-export-${new Date().toISOString().slice(0, 10)}.csv`);
      return res.send(csv);
    } catch (err: any) {
      console.error("CSV export error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  return httpServer;
}
