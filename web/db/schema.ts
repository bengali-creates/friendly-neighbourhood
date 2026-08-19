import { pgTable, serial, text, integer, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";

export const inventory = pgTable("inventory", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  purchasedYear: integer("purchased_year"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const serviceWatches = pgTable("service_watches", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  category: text("category").notNull(), // ToS, Pricing, Government Notice, Civic Scheme
  collectorId: text("collector_id").notNull(),
  lastStatus: text("last_status").default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const snapshots = pgTable("snapshots", {
  id: serial("id").primaryKey(),
  collectorId: text("collector_id").notNull(),
  url: text("url"),
  text: text("text"),
  raw: jsonb("raw"),
  scrapedAt: timestamp("scraped_at").defaultNow().notNull(),
});

export const alerts = pgTable("alerts", {
  id: serial("id").primaryKey(),
  collectorId: text("collector_id").notNull(),
  severity: text("severity").notNull(), // INFO, WARNING, CRITICAL
  message: text("message").notNull(),
  draftScript: text("draft_script"),
  category: text("category").default("general"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const healEvents = pgTable("heal_events", {
  id: serial("id").primaryKey(),
  collectorId: text("collector_id").notNull(),
  description: text("description").notNull(),
  attempts: integer("attempts").default(1),
  healedAt: timestamp("healed_at").defaultNow().notNull(),
});

export const civicNotices = pgTable("civic_notices", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  schemeName: text("scheme_name"),
  category: text("category").notNull(), // Welfare, Scholarship, Hazard, Roadwork
  summary: text("summary").notNull(),
  sourceUrl: text("source_url"),
  effectiveDate: timestamp("effective_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
