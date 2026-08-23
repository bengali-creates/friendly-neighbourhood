ALTER TABLE "heal_events" ADD COLUMN "heal_type" text DEFAULT 'extraction';--> statement-breakpoint
ALTER TABLE "heal_events" ADD COLUMN "resolution" text;--> statement-breakpoint
ALTER TABLE "heal_events" ADD COLUMN "duration_ms" integer;--> statement-breakpoint
ALTER TABLE "heal_events" ADD COLUMN "succeeded" boolean DEFAULT true;