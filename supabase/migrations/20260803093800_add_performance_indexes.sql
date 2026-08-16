-- Add missing performance indexes identified in the Application Audit
CREATE INDEX IF NOT EXISTS idx_cartons_of_id ON cartons(of_id);
CREATE INDEX IF NOT EXISTS idx_production_sessions_machine_id ON production_sessions(machine_id);
CREATE INDEX IF NOT EXISTS idx_cartons_article_id ON cartons(article_id);
