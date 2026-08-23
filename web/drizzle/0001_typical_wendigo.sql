CREATE TABLE "collectors" (
	"id" serial PRIMARY KEY NOT NULL,
	"collector_id" text NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"source_type" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "collectors_collector_id_unique" UNIQUE("collector_id"),
	CONSTRAINT "collectors_url_unique" UNIQUE("url")
);
--> statement-breakpoint
CREATE TABLE "keyword_searches" (
	"id" serial PRIMARY KEY NOT NULL,
	"keyword" text NOT NULL,
	"unified_position_a" text NOT NULL,
	"unified_position_b" text NOT NULL,
	"summary" text NOT NULL,
	"sources_count" integer DEFAULT 0,
	"raw_results" jsonb,
	"searched_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recall_matches" (
	"id" serial PRIMARY KEY NOT NULL,
	"inventory_id" text NOT NULL,
	"recall_title" text NOT NULL,
	"recall_url" text NOT NULL,
	"confidence" real NOT NULL,
	"hazard_description" text,
	"remedy" text,
	"status" text DEFAULT 'unclaimed',
	"matched_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sources" (
	"id" serial PRIMARY KEY NOT NULL,
	"alert_id" integer NOT NULL,
	"title" text NOT NULL,
	"url" text NOT NULL,
	"snippet" text,
	"source_type" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"name" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "alerts" ADD COLUMN "position_a" text;--> statement-breakpoint
ALTER TABLE "alerts" ADD COLUMN "position_b" text;--> statement-breakpoint
ALTER TABLE "inventory" ADD COLUMN "model_number" text;