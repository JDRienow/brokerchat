CREATE TABLE "brokers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"first_name" varchar(255) NOT NULL,
	"last_name" varchar(255) NOT NULL,
	"company_name" varchar(255),
	"logo_url" text,
	"phone" varchar(50),
	"subscription_tier" varchar(50) DEFAULT 'basic',
	"subscription_status" varchar(50) DEFAULT 'active',
	"reset_token" varchar(255),
	"reset_token_expires" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "brokers_email_unique" UNIQUE("email")
);
