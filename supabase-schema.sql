-- Villa Tapi - Supabase Database Schema
-- Este esquema incluye todas las tablas con RLS y la nueva estructura de variantes

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLA: recepcionistas
-- Usuarios del sistema (staff)
-- =====================================================
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

-- RLS for recepcionistas
ALTER TABLE recepcionistas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Recepcionistas podem ver todos" ON recepcionistas
  FOR SELECT USING (true);

CREATE POLICY "Apenas admins podem modificar recepcionistas" ON recepcionistas
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM recepcionistas WHERE email = auth.jwt() ->> 'email' AND role = 'admin'
    )
  );

-- =====================================================
-- TABLA: agencias
-- Proveedores de servicios (agencias, restaurantes, etc)
-- =====================================================
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

-- RLS for agencias
ALTER TABLE agencias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agencias são visíveis para todos autenticados" ON agencias
  FOR SELECT USING (true);

CREATE POLICY "Apenas admins podem modificar agencias" ON agencias
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM recepcionistas WHERE email = auth.jwt() ->> 'email' AND role = 'admin'
    )
  );

-- =====================================================
-- TABLA: grupos_passeios
-- Catálogo de paseos (tours) com informações marketing
-- =====================================================
CREATE TABLE grupos_passeios (
  id BIGSERIAL PRIMARY KEY,
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
  imagenes_galeria TEXT, -- JSON array of image URLs
  duracao TEXT,
  tipo_grupo TEXT,
  tipo_roteiro TEXT DEFAULT 'Fixo' CHECK (tipo_roteiro IN ('Fixo', 'Flexível')),
  is_ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for grupos_passeios
ALTER TABLE grupos_passeios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Grupos são públicos" ON grupos_passeios
  FOR SELECT USING (is_ativo = true);

CREATE POLICY "Staff pode modificar grupos" ON grupos_passeios
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM recepcionistas WHERE email = auth.jwt() ->> 'email' AND is_ativo = true
    )
  );

-- =====================================================
-- TABLA: paradas_roteiro
-- Stops/paradas en el itinerario de cada grupo
-- =====================================================
CREATE TABLE paradas_roteiro (
  id BIGSERIAL PRIMARY KEY,
  grupo_passeio_id BIGINT NOT NULL REFERENCES grupos_passeios(id) ON DELETE CASCADE,
  ordem INTEGER NOT NULL,
  hora TEXT,
  titulo_pt TEXT NOT NULL,
  titulo_es TEXT,
  titulo_en TEXT,
  titulo_fr TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for ordering
CREATE INDEX idx_paradas_grupo_ordem ON paradas_roteiro(grupo_passeio_id, ordem);

-- RLS for paradas_roteiro
ALTER TABLE paradas_roteiro ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Paradas são públicas" ON paradas_roteiro
  FOR SELECT USING (true);

CREATE POLICY "Staff pode modificar paradas" ON paradas_roteiro
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM recepcionistas WHERE email = auth.jwt() ->> 'email' AND is_ativo = true
    )
  );

-- =====================================================
-- TABLA: variantes_servico (NUEVA)
-- Variantes de transporte para cada grupo de paseo
-- Ejemplo: "Lado Este" tiene variantes: Buggy, Quadriciclo, Hilux
-- =====================================================
CREATE TABLE variantes_servico (
  id BIGSERIAL PRIMARY KEY,
  grupo_passeio_id BIGINT REFERENCES grupos_passeios(id) ON DELETE SET NULL,
  nome TEXT NOT NULL, -- Nombre base del servicio (ej: "Transfer Aeroporto-Jeri")
  tipo TEXT NOT NULL, -- Categoría: Transfer, Passeio, Gastronomia, etc
  tipo_transporte TEXT CHECK (tipo_transporte IN ('Buggy', 'Quadriciclo', 'Hilux/Jardineira', NULL)),
  modelo_cobranca TEXT NOT NULL CHECK (modelo_cobranca IN ('Por Pessoa', 'Por Veículo')),
  agencia_id BIGINT NOT NULL REFERENCES agencias(id) ON DELETE RESTRICT,
  valor_neto REAL NOT NULL,
  valor_venda REAL,
  comissao_tipo TEXT NOT NULL CHECK (comissao_tipo IN ('%', 'Fixo', 'Margem')),
  comissao_valor REAL NOT NULL,
  is_ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_variantes_grupo ON variantes_servico(grupo_passeio_id);
CREATE INDEX idx_variantes_tipo ON variantes_servico(tipo);
CREATE INDEX idx_variantes_agencia ON variantes_servico(agencia_id);

-- RLS for variantes_servico
ALTER TABLE variantes_servico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Variantes ativas são visíveis" ON variantes_servico
  FOR SELECT USING (is_ativo = true);

CREATE POLICY "Staff pode modificar variantes" ON variantes_servico
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM recepcionistas WHERE email = auth.jwt() ->> 'email' AND is_ativo = true
    )
  );

-- =====================================================
-- TABLA: servicos (SIMPLIFICADA)
-- Ahora es una tabla de compatibilidad/legacy
-- En el futuro podría deprecarse a favor de variantes_servico
-- =====================================================
CREATE TABLE servicos (
  id BIGSERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL,
  valor_neto REAL NOT NULL,
  valor_venda REAL,
  comissao_valor REAL NOT NULL,
  comissao_tipo TEXT NOT NULL CHECK (comissao_tipo IN ('%', 'Fixo', 'Margem')),
  modelo_cobranca TEXT NOT NULL CHECK (modelo_cobranca IN ('Por Pessoa', 'Por Veículo')),
  agencia_id BIGINT NOT NULL REFERENCES agencias(id) ON DELETE RESTRICT,
  grupo_passeio_id BIGINT REFERENCES grupos_passeios(id) ON DELETE SET NULL,
  tipo_transporte TEXT CHECK (tipo_transporte IN ('Buggy', 'Quadriciclo', 'Hilux/Jardineira', NULL)),
  -- Marketing fields (legacy)
  nome_pt TEXT,
  nome_es TEXT,
  nome_en TEXT,
  nome_fr TEXT,
  descricao_comercial TEXT,
  descricao_pt TEXT,
  descricao_es TEXT,
  descricao_en TEXT,
  descricao_fr TEXT,
  imagen_portada_url TEXT,
  imagenes_galeria TEXT,
  imagem_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_servicos_agencia ON servicos(agencia_id);
CREATE INDEX idx_servicos_grupo ON servicos(grupo_passeio_id);
CREATE INDEX idx_servicos_tipo ON servicos(tipo);

-- RLS for servicos
ALTER TABLE servicos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Servicos são visíveis" ON servicos
  FOR SELECT USING (true);

CREATE POLICY "Staff pode modificar servicos" ON servicos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM recepcionistas WHERE email = auth.jwt() ->> 'email' AND is_ativo = true
    )
  );

-- =====================================================
-- TABLA: agendamentos
-- Reservas/bookings de servicios
-- =====================================================
CREATE TABLE agendamentos (
  id BIGSERIAL PRIMARY KEY,
  data DATE NOT NULL,
  hora TEXT NOT NULL,
  data_volta DATE, -- NUEVO: fecha de vuelta (para transfers ida y vuelta)
  hora_volta TEXT, -- NUEVO: hora de vuelta
  servico_id BIGINT NOT NULL REFERENCES servicos(id) ON DELETE RESTRICT,
  agencia_id BIGINT NOT NULL REFERENCES agencias(id) ON DELETE RESTRICT,
  recepcionista_id BIGINT NOT NULL REFERENCES recepcionistas(id) ON DELETE RESTRICT,
  hospede_nome TEXT NOT NULL,
  hospede_idioma TEXT NOT NULL CHECK (hospede_idioma IN ('PT', 'ES', 'EN', 'IN')),
  qtd_pessoas INTEGER NOT NULL CHECK (qtd_pessoas > 0),
  numero_quarto TEXT, -- Ya existía en SQLite
  contato_hospede TEXT,
  numero_voo TEXT,
  hora_voo TEXT,
  numero_voo_volta TEXT, -- NUEVO: número de vuelo de vuelta
  hora_voo_volta TEXT, -- NUEVO: hora de vuelo de vuelta
  -- Financiero
  valor_neto REAL NOT NULL,
  valor_total REAL NOT NULL,
  valor_sinal REAL NOT NULL,
  comissao REAL NOT NULL,
  valor_consumido REAL, -- Para restaurantes: valor consumido después del servicio
  status_comissao TEXT NOT NULL DEFAULT 'Aberto' CHECK (status_comissao IN ('Aberto', 'Liquidada')),
  -- Status
  status TEXT DEFAULT 'Confirmado' CHECK (status IN ('Confirmado', 'Cancelado')),
  status_servico TEXT NOT NULL DEFAULT 'Agendado' CHECK (status_servico IN ('Agendado', 'Realizado', 'Cancelado')),
  -- Vinculación (para ida y vuelta)
  agendamento_vinculado_id BIGINT REFERENCES agendamentos(id) ON DELETE SET NULL,
  -- Extras
  observacoes TEXT,
  lista_nomes TEXT, -- JSON con lista de nombres (para restaurantes)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_agendamentos_data ON agendamentos(data DESC);
CREATE INDEX idx_agendamentos_servico ON agendamentos(servico_id);
CREATE INDEX idx_agendamentos_agencia ON agendamentos(agencia_id);
CREATE INDEX idx_agendamentos_recepcionista ON agendamentos(recepcionista_id);
CREATE INDEX idx_agendamentos_status ON agendamentos(status_servico);

-- RLS for agendamentos
ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff pode ver todos os agendamentos" ON agendamentos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM recepcionistas WHERE email = auth.jwt() ->> 'email' AND is_ativo = true
    )
  );

CREATE POLICY "Staff pode criar agendamentos" ON agendamentos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM recepcionistas WHERE email = auth.jwt() ->> 'email' AND is_ativo = true
    )
  );

CREATE POLICY "Staff pode modificar agendamentos" ON agendamentos
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM recepcionistas WHERE email = auth.jwt() ->> 'email' AND is_ativo = true
    )
  );

CREATE POLICY "Apenas admins podem deletar agendamentos" ON agendamentos
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM recepcionistas WHERE email = auth.jwt() ->> 'email' AND role = 'admin'
    )
  );

-- =====================================================
-- TABLA: avisos_turno
-- Avisos/notificaciones entre turnos
-- =====================================================
CREATE TABLE avisos_turno (
  id BIGSERIAL PRIMARY KEY,
  mensaje TEXT NOT NULL,
  recepcionista_id BIGINT NOT NULL REFERENCES recepcionistas(id) ON DELETE CASCADE,
  estado TEXT NOT NULL DEFAULT 'Ativo' CHECK (estado IN ('Ativo', 'Resuelto')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX idx_avisos_estado ON avisos_turno(estado, created_at DESC);

-- RLS for avisos_turno
ALTER TABLE avisos_turno ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff pode ver avisos ativos" ON avisos_turno
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM recepcionistas WHERE email = auth.jwt() ->> 'email' AND is_ativo = true
    )
  );

CREATE POLICY "Staff pode criar e modificar avisos" ON avisos_turno
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM recepcionistas WHERE email = auth.jwt() ->> 'email' AND is_ativo = true
    )
  );

-- =====================================================
-- TABLA: audit_logs
-- Registro de auditoría de cambios
-- =====================================================
CREATE TABLE audit_logs (
  id BIGSERIAL PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id BIGINT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE')),
  performed_by BIGINT NOT NULL REFERENCES recepcionistas(id) ON DELETE CASCADE,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_audit_table_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_performed_by ON audit_logs(performed_by);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);

-- RLS for audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem ver todos os logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM recepcionistas WHERE email = auth.jwt() ->> 'email' AND role = 'admin'
    )
  );

CREATE POLICY "Sistema pode inserir logs" ON audit_logs
  FOR INSERT WITH CHECK (true);

-- =====================================================
-- TRIGGERS: Auto-update updated_at timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_recepcionistas_updated_at BEFORE UPDATE ON recepcionistas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agencias_updated_at BEFORE UPDATE ON agencias
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_grupos_passeios_updated_at BEFORE UPDATE ON grupos_passeios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_paradas_roteiro_updated_at BEFORE UPDATE ON paradas_roteiro
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_variantes_servico_updated_at BEFORE UPDATE ON variantes_servico
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_servicos_updated_at BEFORE UPDATE ON servicos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agendamentos_updated_at BEFORE UPDATE ON agendamentos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_avisos_turno_updated_at BEFORE UPDATE ON avisos_turno
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_audit_logs_updated_at BEFORE UPDATE ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- DATOS INICIALES (OPCIONAL)
-- =====================================================

-- Crear usuario admin inicial (contraseña debe ser hasheada en la app)
-- INSERT INTO recepcionistas (nome, email, role, is_ativo) 
-- VALUES ('Administrador', 'admin@villatapi.com', 'admin', true);

-- Fin del schema
