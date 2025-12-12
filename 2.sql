
CREATE TABLE agendamentos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  data DATE NOT NULL,
  hora TEXT NOT NULL,
  servico_id INTEGER NOT NULL,
  agencia_id INTEGER NOT NULL,
  recepcionista_id INTEGER NOT NULL,
  hospede_nome TEXT NOT NULL,
  hospede_idioma TEXT NOT NULL,
  qtd_pessoas INTEGER NOT NULL,
  valor_neto REAL NOT NULL,
  valor_total REAL NOT NULL,
  valor_sinal REAL NOT NULL,
  comissao REAL NOT NULL,
  status_comissao TEXT NOT NULL DEFAULT 'Aberto',
  agendamento_vinculado_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_agendamentos_data ON agendamentos(data);
CREATE INDEX idx_agendamentos_servico ON agendamentos(servico_id);
CREATE INDEX idx_agendamentos_recepcionista ON agendamentos(recepcionista_id);
