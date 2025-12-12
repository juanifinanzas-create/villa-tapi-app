
-- Alterar tabela agencias: adicionar campos específicos de PIX
ALTER TABLE agencias ADD COLUMN chave_pix TEXT;
ALTER TABLE agencias ADD COLUMN titular_pix TEXT;
