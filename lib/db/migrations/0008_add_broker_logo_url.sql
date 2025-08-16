-- Add logo_url field to brokers table for white-label branding
ALTER TABLE "brokers" ADD COLUMN IF NOT EXISTS "logo_url" text; 