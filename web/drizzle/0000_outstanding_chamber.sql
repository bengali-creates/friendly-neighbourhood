CREATE TABLE "alerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"collector_id" text NOT NULL,
	"severity" text NOT NULL,
	"message" text NOT NULL,
	"draft_script" text,
	"category" text DEFAULT 'general',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "civic_notices" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"scheme_name" text,
	"category" text NOT NULL,
	"summary" text NOT NULL,
	"source_url" text,
	"effective_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "heal_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"collector_id" text NOT NULL,
	"description" text NOT NULL,
	"attempts" integer DEFAULT 1,
	"healed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"purchased_year" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_watches" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"category" text NOT NULL,
	"collector_id" text NOT NULL,
	"last_status" text DEFAULT 'active',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"collector_id" text NOT NULL,
	"url" text,
	"text" text,
	"raw" jsonb,
	"scraped_at" timestamp DEFAULT now() NOT NULL
);
