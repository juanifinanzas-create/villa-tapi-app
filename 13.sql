
CREATE TABLE grupos_passeios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  nome_pt TEXT NOT NULL,
  nome_es TEXT,
  nome_en TEXT,
  nome_fr TEXT,
  descricao_pt TEXT,
  descricao_es TEXT,
  descricao_en TEXT,
  descricao_fr TEXT,
  imagen_portada_url TEXT,
  imagenes_galeria TEXT,
  is_ativo BOOLEAN DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_grupos_passeios_slug ON grupos_passeios(slug);
CREATE INDEX idx_grupos_passeios_is_ativo ON grupos_passeios(is_ativo);

ALTER TABLE servicos ADD COLUMN grupo_passeio_id INTEGER;
