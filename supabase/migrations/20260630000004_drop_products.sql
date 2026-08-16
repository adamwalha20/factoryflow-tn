-- Drop old foreign key constraints
ALTER TABLE production_sessions DROP CONSTRAINT IF EXISTS production_sessions_product_id_fkey;
ALTER TABLE quality_inspections DROP CONSTRAINT IF EXISTS quality_inspections_product_id_fkey;

-- Rename product_id column to article_id
ALTER TABLE production_sessions RENAME COLUMN product_id TO article_id;
ALTER TABLE quality_inspections RENAME COLUMN product_id TO article_id;

-- Clear out any old UUIDs that won't match the new articles table (optional but safe)
UPDATE production_sessions SET article_id = NULL;
UPDATE quality_inspections SET article_id = NULL;

-- Add new foreign key constraints pointing to articles
ALTER TABLE production_sessions
    ADD CONSTRAINT production_sessions_article_id_fkey
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE SET NULL;

ALTER TABLE quality_inspections
    ADD CONSTRAINT quality_inspections_article_id_fkey
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE SET NULL;

-- Drop the redundant products table
DROP TABLE IF EXISTS products;
