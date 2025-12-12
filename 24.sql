
ALTER TABLE agendamentos ADD COLUMN horario_pendente BOOLEAN DEFAULT 0;
CREATE INDEX idx_agendamentos_pendente ON agendamentos(horario_pendente) WHERE horario_pendente = 1;
