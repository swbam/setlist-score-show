-- Migration: Add trending_score column to shows table
-- Description: Add trending score tracking for enhanced search and discovery

ALTER TABLE shows 
ADD COLUMN IF NOT EXISTS trending_score NUMERIC DEFAULT 0;
