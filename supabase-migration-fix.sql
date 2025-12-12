-- Fix Supabase schema to match application code
-- This updates the tables to have the correct structure

-- First, drop the existing tables to recreate them properly
DROP TABLE IF EXISTS agencias CASCADE;
DROP TABLE IF EXISTS recepcionistas CASCADE;

-- Recreate agencias with correct schema
CREATE TABLE agencias (
  id BIGSERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('Transfer', 'Passeio', 'Restaurante', 'Outro')),
  whatsapp TEXT,
  dados_bancarios TEXT,
  chave_pix TEXT,
  titular_pix TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recreate recepcionistas with correct schema
CREATE TABLE recepcionistas (
  id BIGSERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'staff')),
  is_ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on both tables
ALTER TABLE agencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE recepcionistas ENABLE ROW LEVEL SECURITY;

-- Create permissive policies (allow all since app has its own auth)
CREATE POLICY "Allow all on agencias" ON agencias FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on recepcionistas" ON recepcionistas FOR ALL USING (true) WITH CHECK (true);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_agencias_updated_at BEFORE UPDATE ON agencias
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recepcionistas_updated_at BEFORE UPDATE ON recepcionistas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing
INSERT INTO recepcionistas (nome, email, password_hash, role, is_ativo) VALUES
  ('Juan', 'juani.finanzas@gmail.com', '$2a$10$example_hash_for_testing', 'admin', true),
  ('Sinara', 'srs.sinara@gmail.com', '$2a$10$example_hash_for_testing', 'staff', true);

INSERT INTO agencias (nome, tipo, whatsapp, chave_pix, titular_pix) VALUES
  ('Clerton Turismo', 'Transfer', '+55 85 99999-9999', '798.736.773-72', 'Clerton Albuquerque'),
  ('Mauro Passeios', 'Passeio', '+55 85 98888-8888', 'mauro@pix.com', 'Mauro Silva');
