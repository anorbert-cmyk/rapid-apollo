-- ===========================================
-- ENCRYPTION MIGRATION - Add email_hash for lookups
-- Run this after enabling field-level encryption
-- ===========================================

-- Add email_hash column to magic_links for searchable lookups
-- The email field will be encrypted, but email_hash allows queries
ALTER TABLE magic_links ADD COLUMN IF NOT EXISTS email_hash VARCHAR(64);

-- Create index on email_hash
CREATE INDEX IF NOT EXISTS idx_magic_links_email_hash ON magic_links(email_hash);

-- Add email_hash column to solutions for searchable lookups
ALTER TABLE solutions ADD COLUMN IF NOT EXISTS wallet_hash VARCHAR(64);

-- Create index on wallet_hash
CREATE INDEX IF NOT EXISTS idx_solutions_wallet_hash ON solutions(wallet_hash);

-- Note: Existing data will have NULL email_hash/wallet_hash
-- New encrypted data will populate these fields
-- For backwards compatibility, queries should check both old and new columns
