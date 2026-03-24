/**
 * Seed script: Normalizes raw state entity data into the unified entities table.
 * Run with: npx tsx server/seed.ts
 */
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { entities, users, subscriptions } from "../shared/schema";
import { sql } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, "../../entity_data");
const sqlite = new Database("data.db");
sqlite.pragma("journal_mode = WAL");
const db = drizzle(sqlite);

interface NormalizedEntity {
  sourceId: string | null;
  name: string;
  entityType: string | null;
  state: string;
  filingDate: string | null;
  city: string | null;
  county: string | null;
  zipCode: string | null;
  address: string | null;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  naicsCode: string | null;
  status: string | null;
  jurisdiction: string | null;
}

// ── Entity type normalization ──────────────────────────
function normalizeEntityType(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const upper = raw.toUpperCase().trim();
  // LLC variants
  if (upper.includes("LLC") || upper.includes("LIMITED LIABILITY") || upper === "DLLC" || upper === "FLLC"
    || upper === "AFLAL" || upper === "DLCA" || upper === "DLCA-PBC") return "LLC";
  // Corporation variants
  if (upper.includes("CORP") || upper.includes("INC") || upper === "DPC" || upper === "FPC"
    || upper === "DPC-PBC" || upper === "DC56" || upper === "DC56-PBC"
    || upper.includes("DOMESTIC PROFIT") || upper.includes("FOREIGN PROFIT")
    || upper === "ADOMP" || upper === "AFORP" || upper === "STOCK") return "Corporation";
  // Nonprofit variants
  if (upper.includes("NONPROFIT") || upper.includes("NOT-FOR-PROFIT") || upper === "DNC" || upper === "FNC"
    || upper === "ADOMNP" || upper === "AFORNP" || upper.includes("NON-STOCK") || upper === "RELIGIOUS") return "Nonprofit";
  // LP variants
  if (upper.includes("LP") || upper.includes("LIMITED PARTNER")) return "LP";
  if (upper.includes("LLP")) return "LLP";
  // Other known types
  if (upper === "IS") return "Sole Proprietor";
  if (upper.includes("PARTNERSHIP") || upper === "GP") return "Partnership";
  if (upper.includes("TRUST")) return "Trust";
  if (upper.includes("COOP") || upper === "FCOOP") return "Cooperative";
  if (upper === "ASSUMED BUSINESS NAME" || upper === "RESERVED NAME") return upper.charAt(0) + upper.slice(1).toLowerCase();
  return raw.trim();
}

// ── Date normalization ─────────────────────────────────
function normalizeDate(raw: string | undefined | null): string | null {
  if (!raw) return null;
  // Handle ISO dates like 2026-03-22T00:00:00.000
  const isoMatch = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoMatch) return isoMatch[1];
  // Handle MM/DD/YYYY format
  const usMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (usMatch) return `${usMatch[3]}-${usMatch[1].padStart(2, '0')}-${usMatch[2].padStart(2, '0')}`;
  return raw;
}

// ── State parsers ──────────────────────────────────────
function parseCO(data: any[]): NormalizedEntity[] {
  return data.map(r => ({
    sourceId: r.entityid || null,
    name: r.entityname || "",
    entityType: normalizeEntityType(r.entitytype),
    state: "CO",
    filingDate: normalizeDate(r.entityformdate),
    city: r.principalcity || null,
    county: null,
    zipCode: r.principalzipcode || null,
    address: r.principaladdress1 || null,
    contactName: [r.agentfirstname, r.agentlastname].filter(Boolean).join(" ") || r.agentorganizationname || null,
    email: null,
    phone: null,
    naicsCode: null,
    status: r.entitystatus || null,
    jurisdiction: r.jurisdictonofformation || null,
  }));
}

function parseCT(data: any[]): NormalizedEntity[] {
  return data.map(r => ({
    sourceId: r.accountnumber || r.id || null,
    name: r.name || "",
    entityType: normalizeEntityType(r.business_type),
    state: "CT",
    filingDate: normalizeDate(r.date_registration),
    city: r.billingcity || null,
    county: null,
    zipCode: r.billingpostalcode || null,
    address: r.billingstreet || null,
    contactName: null,
    email: r.business_email_address || r.category_survey_email_address || null,
    phone: null,
    naicsCode: r.naics_code || null,
    status: r.status || null,
    jurisdiction: r.formation_place || null,
  }));
}

function parseNY(data: any[]): NormalizedEntity[] {
  return data.map(r => ({
    sourceId: r.dos_id || null,
    name: r.current_entity_name || "",
    entityType: normalizeEntityType(r.entity_type),
    state: "NY",
    filingDate: normalizeDate(r.initial_dos_filing_date),
    city: r.dos_process_city || null,
    county: r.county || null,
    zipCode: r.dos_process_zip || null,
    address: r.dos_process_address_1 || null,
    contactName: r.dos_process_name || null,
    email: null,
    phone: null,
    naicsCode: null,
    status: null,
    jurisdiction: r.jurisdiction || null,
  }));
}

function parseFL(data: any[]): NormalizedEntity[] {
  return data.map(r => ({
    sourceId: r.doc_number || null,
    name: r.entity_name || "",
    entityType: normalizeEntityType(r.type_code),
    state: "FL",
    filingDate: normalizeDate(r.filing_date || r.file_date),
    city: r.principal_city || null,
    county: null,
    zipCode: r.principal_zip || null,
    address: r.principal_address || null,
    contactName: r.agent_name || null,
    email: null,
    phone: null,
    naicsCode: null,
    status: null,
    jurisdiction: null,
  }));
}

function parseTX(data: any[]): NormalizedEntity[] {
  return data.map(r => ({
    sourceId: r.taxpayer_number || null,
    name: r.outlet_name || r.taxpayer_name || "",
    entityType: normalizeEntityType(r.taxpayer_organization_type),
    state: "TX",
    filingDate: normalizeDate(r.outlet_permit_issue_date || r.outlet_first_sales_date),
    city: r.outlet_city || r.taxpayer_city || null,
    county: null,
    zipCode: r.outlet_zip_code || r.taxpayer_zip_code || null,
    address: r.outlet_address || r.taxpayer_address || null,
    contactName: r.taxpayer_name || null,
    email: null,
    phone: null,
    naicsCode: r.outlet_naics_code || null,
    status: null,
    jurisdiction: null,
  }));
}

function parseOR(data: any[]): NormalizedEntity[] {
  return data.map(r => ({
    sourceId: r.registry_number || null,
    name: r.business_name || "",
    entityType: normalizeEntityType(r.entity_type),
    state: "OR",
    filingDate: normalizeDate(r.registry_date),
    city: r.city || null,
    county: null,
    zipCode: r.zip || null,
    address: r.address || null,
    contactName: [r.first_name, r.last_name].filter(Boolean).join(" ") || null,
    email: null,
    phone: null,
    naicsCode: null,
    status: null,
    jurisdiction: r.jurisdiction || null,
  }));
}

function parseIA(data: any[]): NormalizedEntity[] {
  return data.map(r => ({
    sourceId: r.corp_number || null,
    name: r.legal_name || "",
    entityType: normalizeEntityType(r.corporation_type),
    state: "IA",
    filingDate: normalizeDate(r.effective_date),
    city: r.ho_city || r.ra_city || null,
    county: null,
    zipCode: r.ho_zip || r.ra_zip || null,
    address: r.ho_address_1 || r.ra_address_1 || null,
    contactName: r.registered_agent || null,
    email: null,
    phone: null,
    naicsCode: null,
    status: null,
    jurisdiction: null,
  }));
}

function parseCA(data: any[]): NormalizedEntity[] {
  return data.map(r => ({
    sourceId: r.entity_number || null,
    name: r.entity_name || "",
    entityType: normalizeEntityType(r.entity_type),
    state: "CA",
    filingDate: normalizeDate(r.filing_date),
    city: null,
    county: null,
    zipCode: null,
    address: r.address || null,
    contactName: r.agent || null,
    email: null,
    phone: null,
    naicsCode: null,
    status: r.status || null,
    jurisdiction: r.jurisdiction || null,
  }));
}

function parseWA(data: any[]): NormalizedEntity[] {
  return data.map(r => ({
    sourceId: r.ubi_number || null,
    name: r.business_name || "",
    entityType: normalizeEntityType(r.entity_type),
    state: "WA",
    filingDate: null,
    city: r.city || null,
    county: null,
    zipCode: r.zip || null,
    address: r.address || null,
    contactName: r.agent_name || null,
    email: null,
    phone: null,
    naicsCode: null,
    status: r.status || null,
    jurisdiction: null,
  }));
}

function parseAZ(data: any[]): NormalizedEntity[] {
  return data.map(r => ({
    sourceId: r.file_number || null,
    name: r.entity_name || "",
    entityType: normalizeEntityType(r.entity_type),
    state: "AZ",
    filingDate: normalizeDate(r.filing_date),
    city: r.city || null,
    county: null,
    zipCode: r.zip || null,
    address: r.address || null,
    contactName: r.agent_name || null,
    email: null,
    phone: null,
    naicsCode: null,
    status: r.status || null,
    jurisdiction: null,
  }));
}

function parseLA(data: any[]): NormalizedEntity[] {
  return data.map(r => {
    const agentInfo = Array.isArray(r.agent_info) ? r.agent_info[0] : r.agent_info;
    // Extract contact name from agent info (e.g., "RUDY ANDERSON 922 BURR STREET...")
    const agentName = agentInfo ? agentInfo.split(/\d/)[0].trim() : null;
    return {
      sourceId: r.charter_number || null,
      name: r.business_name || "",
      entityType: normalizeEntityType(r.entity_type),
      state: "LA",
      filingDate: normalizeDate(r.filing_date),
      city: null,
      county: null,
      zipCode: null,
      address: r.address || null,
      contactName: agentName || null,
      email: null,
      phone: null,
      naicsCode: null,
      status: r.status || null,
      jurisdiction: null,
    };
  });
}

// ── Main ───────────────────────────────────────────────
async function seed() {
  console.log("Creating tables...");

  // Create tables
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      name TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      state TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      stripe_subscription_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS entities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_id TEXT,
      name TEXT NOT NULL,
      entity_type TEXT,
      state TEXT NOT NULL,
      filing_date TEXT,
      city TEXT,
      county TEXT,
      zip_code TEXT,
      address TEXT,
      contact_name TEXT,
      email TEXT,
      phone TEXT,
      naics_code TEXT,
      status TEXT,
      jurisdiction TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_entities_state ON entities(state);
    CREATE INDEX IF NOT EXISTS idx_entities_filing_date ON entities(filing_date);
    CREATE INDEX IF NOT EXISTS idx_entities_name ON entities(name);
    CREATE INDEX IF NOT EXISTS idx_entities_city ON entities(city);
    CREATE INDEX IF NOT EXISTS idx_entities_email ON entities(email);
  `);

  // Clear existing entity data
  db.delete(entities).run();

  const loaders: Array<{ file: string; parser: (data: any[]) => NormalizedEntity[]; label: string }> = [
    { file: "co_raw.json", parser: parseCO, label: "CO" },
    { file: "ct_raw.json", parser: parseCT, label: "CT" },
    { file: "ny_active.json", parser: parseNY, label: "NY" },
    { file: "fl_parsed.json", parser: parseFL, label: "FL" },
    { file: "tx_raw.json", parser: parseTX, label: "TX" },
    { file: "or_raw.json", parser: parseOR, label: "OR" },
    { file: "ia_raw.json", parser: parseIA, label: "IA" },
    { file: "ca_raw.json", parser: parseCA, label: "CA" },
    { file: "wa_raw.json", parser: parseWA, label: "WA" },
    { file: "az_raw.json", parser: parseAZ, label: "AZ" },
    { file: "la_raw.json", parser: parseLA, label: "LA" },
  ];

  let totalInserted = 0;

  for (const { file, parser, label } of loaders) {
    const filePath = path.join(DATA_DIR, file);
    if (!fs.existsSync(filePath)) {
      console.log(`  Skipping ${label}: file not found`);
      continue;
    }

    const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    if (!Array.isArray(raw) || raw.length === 0) {
      console.log(`  Skipping ${label}: empty data`);
      continue;
    }

    const normalized = parser(raw).filter(e => e.name && e.name.trim().length > 0);
    console.log(`  ${label}: ${normalized.length} entities`);

    // Insert in chunks (SQLite has a max of ~32766 params, 15 cols per row = 200 rows max)
    const CHUNK = 200;
    for (let i = 0; i < normalized.length; i += CHUNK) {
      db.insert(entities).values(normalized.slice(i, i + CHUNK)).run();
    }

    totalInserted += normalized.length;
  }

  console.log(`\nDone! Inserted ${totalInserted.toLocaleString()} entities total.`);

  // Print stats
  const total = db.select({ count: sql<number>`count(*)` }).from(entities).get();
  const withEmail = db.select({ count: sql<number>`count(*)` }).from(entities).where(sql`email IS NOT NULL AND email != ''`).get();
  const withContact = db.select({ count: sql<number>`count(*)` }).from(entities).where(sql`contact_name IS NOT NULL AND contact_name != ''`).get();
  const stateCount = db.select({ count: sql<number>`count(distinct state)` }).from(entities).get();

  console.log(`\nStats:`);
  console.log(`  Total entities: ${total?.count?.toLocaleString()}`);
  console.log(`  With email: ${withEmail?.count?.toLocaleString()}`);
  console.log(`  With contact name: ${withContact?.count?.toLocaleString()}`);
  console.log(`  States: ${stateCount?.count}`);
}

seed().catch(console.error);
