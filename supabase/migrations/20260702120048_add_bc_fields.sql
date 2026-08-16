ALTER TABLE bons_de_commande ADD COLUMN IF NOT EXISTS mandrin_type TEXT;
ALTER TABLE bons_de_commande ADD COLUMN IF NOT EXISTS carton_type TEXT;
ALTER TABLE bons_de_commande ADD COLUMN IF NOT EXISTS epaisseur TEXT;
ALTER TABLE bons_de_commande ADD COLUMN IF NOT EXISTS quantity INTEGER;
ALTER TABLE bons_de_commande ADD COLUMN IF NOT EXISTS article_reference TEXT;
ALTER TABLE bons_de_commande ADD COLUMN IF NOT EXISTS article_designation TEXT;
