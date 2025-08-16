CREATE TABLE "subscription_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"broker_id" uuid NOT NULL,
	"stripe_event_id" varchar(255) NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"event_data" json NOT NULL,
	"processed" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "brokers" ALTER COLUMN "subscription_tier" SET DEFAULT 'individual';--> statement-breakpoint
ALTER TABLE "brokers" ALTER COLUMN "subscription_status" SET DEFAULT 'trial';--> statement-breakpoint
ALTER TABLE "brokers" ADD COLUMN "stripe_customer_id" varchar(255);--> statement-breakpoint
ALTER TABLE "brokers" ADD COLUMN "stripe_subscription_id" varchar(255);--> statement-breakpoint
ALTER TABLE "brokers" ADD COLUMN "trial_ends_at" timestamp;--> statement-breakpoint
ALTER TABLE "brokers" ADD COLUMN "document_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "subscription_events" ADD CONSTRAINT "subscription_events_broker_id_brokers_id_fk" FOREIGN KEY ("broker_id") REFERENCES "public"."brokers"("id") ON DELETE no action ON UPDATE no action;