
-- Add new fields to grupos_passeios for dynamic experience data
ALTER TABLE grupos_passeios ADD COLUMN duracao TEXT;
ALTER TABLE grupos_passeios ADD COLUMN tipo_grupo TEXT;
ALTER TABLE grupos_passeios ADD COLUMN tipo_roteiro TEXT DEFAULT 'Fixo';

-- Create table for managing itinerary stops/paradas
CREATE TABLE paradas_roteiro (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  grupo_passeio_id INTEGER NOT NULL,
  ordem INTEGER NOT NULL,
  hora TEXT,
  titulo_pt TEXT NOT NULL,
  titulo_es TEXT,
  titulo_en TEXT,
  titulo_fr TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_paradas_grupo ON paradas_roteiro(grupo_passeio_id);
