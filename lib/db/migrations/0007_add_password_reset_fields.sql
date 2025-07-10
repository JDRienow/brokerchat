-- Add password reset token fields to brokers table
ALTER TABLE "brokers" ADD COLUMN IF NOT EXISTS "reset_token" varchar(255);
ALTER TABLE "brokers" ADD COLUMN IF NOT EXISTS "reset_token_expires" timestamp; 