import { pgTable, serial, text, integer, timestamp, boolean, jsonb, real } from "drizzle-orm/pg-core";

export const collectors = pgTable("collectors", {
  id: serial("id").primaryKey(),
  collectorId: text("collector_id").notNull().unique(),   
  name: text("name").notNull(),                           
  url: text("url").notNull().unique(),                    
  sourceType: text("source_type").notNull(),              
  targetSelector: text("target_selector"),
  lastEtag: text("last_etag"),
  lastContentHash: text("last_content_hash"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const inventory = pgTable("inventory", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  modelNumber: text("model_number"),
  purchasedYear: integer("purchased_year"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const serviceWatches = pgTable("service_watches", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  category: text("category").notNull(),   
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

export const recallMatches = pgTable("recall_matches", {
  id: serial("id").primaryKey(),
  inventoryId: text("inventory_id").notNull(),
  recallTitle: text("recall_title").notNull(),
  recallUrl: text("recall_url").notNull(),
  confidence: real("confidence").notNull(),              
  hazardDescription: text("hazard_description"),
  remedy: text("remedy"),
  status: text("status").default("unclaimed"),           
  matchedAt: timestamp("matched_at").defaultNow().notNull(),
});

export const alerts = pgTable("alerts", {
  id: serial("id").primaryKey(),
  collectorId: text("collector_id").notNull(),
  severity: text("severity").notNull(),                  
  message: text("message").notNull(),                    
  draftScript: text("draft_script"),                     
  positionA: text("position_a"),                         
  positionB: text("position_b"),                         
  category: text("category").default("general"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sources = pgTable("sources", {
  id: serial("id").primaryKey(),
  alertId: integer("alert_id").notNull(),                
  title: text("title").notNull(),
  url: text("url").notNull(),
  snippet: text("snippet"),                              
  sourceType: text("source_type").notNull(),             
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const healEvents = pgTable("heal_events", {
  id: serial("id").primaryKey(),
  collectorId: text("collector_id").notNull(),
  description: text("description").notNull(),
  healType: text("heal_type").default("extraction"),    
  resolution: text("resolution"),                        
  attempts: integer("attempts").default(1),
  durationMs: integer("duration_ms"),                    
  succeeded: boolean("succeeded").default(true),
  healedAt: timestamp("healed_at").defaultNow().notNull(),
});

export const civicNotices = pgTable("civic_notices", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  schemeName: text("scheme_name"),
  category: text("category").notNull(),                 
  summary: text("summary").notNull(),
  sourceUrl: text("source_url"),
  effectiveDate: timestamp("effective_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

  
export const keywordSearches = pgTable("keyword_searches", {
  id: serial("id").primaryKey(),
  keyword: text("keyword").notNull(),
  unifiedPositionA: text("unified_position_a").notNull(),
  unifiedPositionB: text("unified_position_b").notNull(),
  summary: text("summary").notNull(),
  sourcesCount: integer("sources_count").default(0),
  rawResults: jsonb("raw_results"),
  searchedAt: timestamp("searched_at").defaultNow().notNull(),
});

  
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

  
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull().default("info"),   
  collectorId: text("collector_id"),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

  
export const activeJobs = pgTable("active_jobs", {
  jobId: text("job_id").primaryKey(),
  collectorId: text("collector_id"),
  url: text("url"),
  status: text("status").notNull().default("initializing"),   
  progress: integer("progress").default(0).notNull(),
  currentStep: text("current_step").default("Initializing scraper task"),
  bytesScraped: integer("bytes_scraped").default(0),
  itemsScraped: integer("items_scraped").default(0),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});



