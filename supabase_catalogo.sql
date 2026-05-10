-- ================================================================
--  DIAMONDS CATÁLOGO — COMPLETE MULTI-TENANT SETUP
--  Replace entire supabase_catalogo.sql with this content
--  Run in Supabase SQL Editor (drops and recreates everything)
-- ================================================================

-- 1. Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Drop existing tables (clean slate - removes old structure)
DROP TABLE IF EXISTS catalogo_produtos CASCADE;
DROP TABLE IF EXISTS catalogo_config CASCADE;
DROP TABLE IF EXISTS lojas CASCADE;

-- 3. Create LOJAS table (Multi-tenant stores)
CREATE TABLE lojas (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  senha_hash TEXT, -- Stores bcrypt hashes (NULL = no password)
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Auto-hash passwords on insert/update
CREATE OR REPLACE FUNCTION hash_store_password()
RETURNS TRIGGER AS $$
BEGIN
  -- Only hash if password provided and not already a bcrypt hash
  IF NEW.senha_hash IS NOT NULL 
     AND NEW.senha_hash != '' 
     AND NEW.senha_hash !~ '^\$2[ayb]\$' THEN
    NEW.senha_hash = crypt(NEW.senha_hash, gen_salt('bf', 12));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER hash_password_trigger
  BEFORE INSERT OR UPDATE ON lojas
  FOR EACH ROW EXECUTE FUNCTION hash_store_password();

-- 5. Secure password verification function (hash never leaves DB)
CREATE OR REPLACE FUNCTION verify_store_password(
  store_slug TEXT,
  input_password TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  stored_hash TEXT;
BEGIN
  SELECT senha_hash INTO stored_hash 
  FROM lojas 
  WHERE slug = store_slug AND ativo = TRUE;
  
  -- If no password set, allow access
  IF stored_hash IS NULL OR stored_hash = '' THEN
    RETURN TRUE;
  END IF;
  
  -- Verify password
  RETURN stored_hash = crypt(input_password, stored_hash);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Password setting function (for store admin)
CREATE OR REPLACE FUNCTION set_store_password(
  store_slug TEXT,
  new_password TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE lojas 
  SET senha_hash = crypt(new_password, gen_salt('bf', 12))
  WHERE slug = store_slug;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create CATALOGO_CONFIG table (with loja_id)
CREATE TABLE catalogo_config (
  id SERIAL PRIMARY KEY,
  loja_id INTEGER REFERENCES lojas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL DEFAULT 'Diamonds Acessórios',
  slogan TEXT NOT NULL DEFAULT 'Acessórios & Semijoias',
  whatsapp TEXT NOT NULL DEFAULT '',
  instagram TEXT NOT NULL DEFAULT '@diamondsacessorios',
  cor_principal TEXT NOT NULL DEFAULT '#C9A84C',
  cor_destaque TEXT NOT NULL DEFAULT '#FA098A',
  promo_ativa BOOLEAN NOT NULL DEFAULT FALSE,
  promo_texto TEXT NOT NULL DEFAULT '',
  categorias JSONB DEFAULT '["Aneis", "Colares", "Brincos", "Pulseiras", "Outros"]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Create CATALOGO_PRODUTOS table (with loja_id)
CREATE TABLE catalogo_produtos (
  id SERIAL PRIMARY KEY,
  loja_id INTEGER REFERENCES lojas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT NOT NULL DEFAULT '',
  categoria TEXT NOT NULL DEFAULT 'Outros',
  preco NUMERIC(10,2) NOT NULL,
  preco_original NUMERIC(10,2),
  em_promocao BOOLEAN NOT NULL DEFAULT FALSE,
  disponivel BOOLEAN NOT NULL DEFAULT TRUE,
  imagem_url TEXT NOT NULL DEFAULT '',
  ordem INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Create updated_at trigger for produtos
CREATE OR REPLACE FUNCTION update_catalogo_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS catalogo_produtos_updated ON catalogo_produtos;
CREATE TRIGGER catalogo_produtos_updated
  BEFORE UPDATE ON catalogo_produtos
  FOR EACH ROW EXECUTE FUNCTION update_catalogo_updated_at();

DROP TRIGGER IF EXISTS catalogo_config_updated ON catalogo_config;
CREATE TRIGGER catalogo_config_updated
  BEFORE UPDATE ON catalogo_config
  FOR EACH ROW EXECUTE FUNCTION update_catalogo_updated_at();

-- 10. Create default store (Diamonds Acessórios)
INSERT INTO lojas (nome, slug, ativo)
VALUES ('Diamonds Acessórios', 'diamonds-acessorios', TRUE);

-- Get the ID of the inserted store and create default data
DO $$
DECLARE
  v_loja_id INTEGER;
BEGIN
  SELECT id INTO v_loja_id FROM lojas WHERE slug = 'diamonds-acessorios';
  
  -- Insert default config for this store
  INSERT INTO catalogo_config (loja_id, nome, slogan, instagram)
  VALUES (v_loja_id, 'Diamonds Acessórios', 'Acessórios & Semijoias', '@diiamondacessorios');
  
  -- Insert sample products
  INSERT INTO catalogo_produtos (loja_id, nome, descricao, categoria, preco, preco_original, em_promocao, ordem) VALUES
    (v_loja_id, 'Anel Solitário Dourado', 'Anel banhado a ouro 18k com zircônia.', 'Anéis', 89.90, NULL, FALSE, 1),
    (v_loja_id, 'Colar Gota de Cristal', 'Colar com pingente de cristal e corrente fina.', 'Colares', 65.00, 90.00, TRUE, 2),
    (v_loja_id, 'Brinco Argola Slim', 'Argola fina banhada a ouro. Leve e elegante.', 'Brincos', 45.90, NULL, FALSE, 3),
    (v_loja_id, 'Pulseira Charm Estrela', 'Pulseira com pingentes de estrela e lua.', 'Pulseiras', 55.00, 75.00, TRUE, 4);
END $$;

-- 11. Enable Row Level Security
ALTER TABLE lojas ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalogo_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalogo_produtos ENABLE ROW LEVEL SECURITY;

-- 12. Create RLS policies (drop existing first)
-- Lojas: Public read, full write
DROP POLICY IF EXISTS "lojas_read" ON lojas;
DROP POLICY IF EXISTS "lojas_write" ON lojas;
CREATE POLICY "lojas_read" ON lojas FOR SELECT USING (TRUE);
CREATE POLICY "lojas_write" ON lojas FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- Catalogo Config: Public read, full write
DROP POLICY IF EXISTS "catalogo_config_read" ON catalogo_config;
DROP POLICY IF EXISTS "catalogo_config_write" ON catalogo_config;
CREATE POLICY "catalogo_config_read" ON catalogo_config FOR SELECT USING (TRUE);
CREATE POLICY "catalogo_config_write" ON catalogo_config FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- Catalogo Produtos: Public read, full write
DROP POLICY IF EXISTS "catalogo_produtos_read" ON catalogo_produtos;
DROP POLICY IF EXISTS "catalogo_produtos_write" ON catalogo_produtos;
CREATE POLICY "catalogo_produtos_read" ON catalogo_produtos FOR SELECT USING (TRUE);
CREATE POLICY "catalogo_produtos_write" ON catalogo_produtos FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- 13. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_catalogo_config_loja_id ON catalogo_config(loja_id);
CREATE INDEX IF NOT EXISTS idx_catalogo_produtos_loja_id ON catalogo_produtos(loja_id);

-- 14. Storage bucket for product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('catalogo-imagens', 'catalogo-imagens', TRUE)
ON CONFLICT DO NOTHING;

-- Storage policies (drop existing first)
DROP POLICY IF EXISTS "catalogo_imagens_upload" ON storage.objects;
DROP POLICY IF EXISTS "catalogo_imagens_read" ON storage.objects;
DROP POLICY IF EXISTS "catalogo_imagens_delete" ON storage.objects;

CREATE POLICY "catalogo_imagens_upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'catalogo-imagens');
CREATE POLICY "catalogo_imagens_read" ON storage.objects FOR SELECT USING (bucket_id = 'catalogo-imagens');
CREATE POLICY "catalogo_imagens_delete" ON storage.objects FOR DELETE USING (bucket_id = 'catalogo-imagens');

-- ================================================================
--  END OF SCRIPT
-- ================================================================
-- After running:
-- 1. 'lojas' table exists with 'senha_hash' column
-- 2. Passwords are auto-hashed using bcrypt (via pgcrypto)
-- 3. Use RPC 'verify_store_password' and 'set_store_password' for secure auth
-- 4. Default store 'diamonds-acessorios' is created with sample products
-- 5. All tables have 'loja_id' for multi-tenancy
