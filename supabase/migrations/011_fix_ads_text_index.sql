-- Fix ads text index - replace with hash index to handle large text values
-- The btree index fails when text values exceed 2704 bytes

-- Drop the existing problematic index
DROP INDEX IF EXISTS idx_ads_text;

-- Create a hash index instead (or use full text search if needed)
-- Hash index works better for large text values
CREATE INDEX IF NOT EXISTS idx_ads_text_hash ON ads USING hash(substring(text, 1, 100));

-- Alternative: Use full text search index for better search capabilities
-- Uncomment if you need full text search on ad text
-- CREATE INDEX IF NOT EXISTS idx_ads_text_fts ON ads USING gin(to_tsvector('english', text));

-- Also fix headline and description indexes if they might have similar issues
-- Drop and recreate with substring to prevent future issues
DROP INDEX IF EXISTS idx_ads_headline;
CREATE INDEX IF NOT EXISTS idx_ads_headline ON ads(substring(headline, 1, 255));

DROP INDEX IF EXISTS idx_ads_description;
CREATE INDEX IF NOT EXISTS idx_ads_description ON ads(substring(description, 1, 255));
