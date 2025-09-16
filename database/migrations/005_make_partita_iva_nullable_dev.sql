-- Migration: Make partita_iva nullable for development
-- Date: 2025-09-05
-- Description: Removes UNIQUE constraint from partita_iva for testing

-- Remove UNIQUE constraint from partita_iva
ALTER TABLE organizations DROP CONSTRAINT IF EXISTS organizations_partita_iva_key;

-- Add it back but allow NULL values and duplicates for development
-- In production, you'll want to re-enable this constraint