CREATE TABLE IF NOT EXISTS "notification_channels" (
	"id" serial PRIMARY KEY NOT NULL,
	"provider" text NOT NULL,
	"name" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"config" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "channel_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"channel_id" integer,
	"provider" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"severity" text DEFAULT 'INFO' NOT NULL,
	"status" text NOT NULL,
	"details" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
