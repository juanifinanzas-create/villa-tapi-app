# Guia de Configuração do Supabase

## Passo 1: Acessar o Projeto Supabase

1. Acesse https://supabase.com
2. Faça login com sua conta
3. Selecione o projeto que está usando (ou crie um novo)

## Passo 2: Executar o Schema SQL

1. No painel do Supabase, vá para **SQL Editor** (ícone de terminal no menu lateral)
2. Clique em **New Query**
3. Copie todo o conteúdo do arquivo `supabase-schema.sql`
4. Cole no editor SQL
5. Clique em **Run** (ou pressione Ctrl+Enter)

⚠️ **Importante**: O script pode levar alguns segundos para executar completamente. Aguarde a mensagem de sucesso.

## Passo 3: Verificar as Tabelas Criadas

1. Vá para **Table Editor** no menu lateral
2. Você deve ver todas as tabelas criadas:
   - recepcionistas
   - agencias
   - grupos_passeios
   - paradas_roteiro
   - variantes_servico
   - servicos (legacy)
   - agendamentos
   - avisos_turno
   - audit_logs

## Passo 4: Configurar RLS (Row Level Security)

As policies de RLS já foram criadas automaticamente pelo script SQL. Para verificar:

1. Clique em qualquer tabela no Table Editor
2. Vá para a aba **Policies**
3. Confirme que existem policies configuradas

## Passo 5: Criar Usuário Admin Inicial (Opcional)

Se quiser criar um usuário admin inicial:

1. Vá para **SQL Editor**
2. Execute este comando (ajuste o email):

```sql
INSERT INTO recepcionistas (nome, email, role, is_ativo) 
VALUES ('Administrador', 'admin@villatapi.com', 'admin', true);
```

3. Você precisará definir a senha posteriormente através da aplicação

## Passo 6: Testar a Conexão

1. No código da aplicação, os secrets já estão configurados:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

2. A aplicação agora tem dois modos:
   - **Modo Legado**: Usa Cloudflare D1 (hooks antigos)
   - **Modo Supabase**: Usa PostgreSQL (hooks com sufixo "Supabase")

3. Para testar, você pode:
   - Usar `useAgenciasSupabase` em vez de `useAgencias`
   - Verificar no console do navegador se há erros de conexão

## Passo 7: Migração de Dados (Se Necessário)

Se você já tem dados em D1 e quer migrá-los para Supabase:

1. Exporte os dados do D1 usando a API REST atual
2. Insira no Supabase usando o SQL Editor ou a API do Supabase

Exemplo para agências:
```sql
INSERT INTO agencias (nome, tipo, whatsapp, chave_pix, titular_pix)
VALUES 
  ('Agência A', 'Transfer', '+5585999999999', 'chave@pix.com', 'Titular Nome'),
  ('Agência B', 'Passeio', '+5585988888888', 'outra@pix.com', 'Outro Titular');
```

## Próximos Passos

Após executar o schema:
1. Teste a página de Agências (já atualizada para usar Supabase)
2. Se funcionar bem, migramos os outros módulos
3. Gradualmente substituímos todos os hooks para usar Supabase

## Troubleshooting

### Erro: "relation already exists"
- Significa que a tabela já foi criada antes
- Você pode dropar todas as tabelas e executar novamente:
```sql
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS avisos_turno CASCADE;
DROP TABLE IF EXISTS paradas_roteiro CASCADE;
DROP TABLE IF EXISTS agendamentos CASCADE;
DROP TABLE IF EXISTS variantes_servico CASCADE;
DROP TABLE IF EXISTS servicos CASCADE;
DROP TABLE IF EXISTS grupos_passeios CASCADE;
DROP TABLE IF EXISTS agencias CASCADE;
DROP TABLE IF EXISTS recepcionistas CASCADE;
```

### Erro de autenticação
- Verifique se `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` estão corretos
- A ANON_KEY deve ter permissão para operações básicas

### RLS bloqueando operações
- Durante desenvolvimento, você pode desabilitar RLS temporariamente:
```sql
ALTER TABLE agencias DISABLE ROW LEVEL SECURITY;
```
- Mas lembre-se de reabilitá-lo em produção!

## Estrutura Nova vs Antiga

### Variantes de Serviço (Novo Modelo)
Antes teríamos:
- Servico: "Lado Este - Buggy"
- Servico: "Lado Este - Quadriciclo"
- Servico: "Lado Este - Hilux"

Agora temos:
- GrupoPasseio: "Lado Este"
- VarianteServico 1: tipo_transporte = "Buggy"
- VarianteServico 2: tipo_transporte = "Quadriciclo"
- VarianteServico 3: tipo_transporte = "Hilux"

Muito mais organizado e fácil de gerenciar!

## Contato

Se tiver dúvidas durante a configuração, documente os erros e vamos resolver juntos na próxima iteração.
