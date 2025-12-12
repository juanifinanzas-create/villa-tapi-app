
CREATE TABLE avisos_turno (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mensaje TEXT NOT NULL,
  recepcionista_id INTEGER NOT NULL,
  estado TEXT NOT NULL DEFAULT 'Ativo',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_avisos_turno_estado ON avisos_turno(estado);
CREATE INDEX idx_avisos_turno_created_at ON avisos_turno(created_at);
