CREATE TABLE "active_jobs" (
	"job_id" text PRIMARY KEY NOT NULL,
	"collector_id" text,
	"url" text,
	"status" text DEFAULT 'initializing' NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"current_step" text DEFAULT 'Initializing scraper task',
	"bytes_scraped" integer DEFAULT 0,
	"items_scraped" integer DEFAULT 0,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"type" text DEFAULT 'info' NOT NULL,
	"collector_id" text,
	"read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "collectors" ADD COLUMN "target_selector" text;--> statement-breakpoint
ALTER TABLE "collectors" ADD COLUMN "last_etag" text;--> statement-breakpoint
ALTER TABLE "collectors" ADD COLUMN "last_content_hash" text;