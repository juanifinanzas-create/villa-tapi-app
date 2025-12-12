import z from "zod";

// Agências (Agencies/Providers)
export const AgenciaSchema = z.object({
  id: z.number(),
  nome: z.string(),
  tipo: z.enum(['Parceiro', 'Interno', 'Transfer', 'Passeio', 'Restaurante', 'Outro']),
  telefone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  chave_pix: z.string().optional().nullable(),
  titular_pix: z.string().optional().nullable(),
  is_ativo: z.boolean(),
  created_at: z.string(),
  updated_at: z.string().optional(),
});

export const CreateAgenciaSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  tipo: z.enum(['Parceiro', 'Interno', 'Transfer', 'Passeio', 'Restaurante', 'Outro']),
  telefone: z.string().optional(),
  email: z.string().optional(),
  chave_pix: z.string().optional(),
  titular_pix: z.string().optional(),
  is_ativo: z.boolean().optional(),
});

export const UpdateAgenciaSchema = CreateAgenciaSchema.partial();

export type Agencia = z.infer<typeof AgenciaSchema>;
export type CreateAgencia = z.infer<typeof CreateAgenciaSchema>;
export type UpdateAgencia = z.infer<typeof UpdateAgenciaSchema>;

// Grupos de Passeios (Tour Marketing Groups)
export const GrupoPasseioSchema = z.object({
  id: z.number(),
  slug: z.string(),
  nome_pt: z.string(),
  nome_es: z.string().optional().nullable(),
  nome_en: z.string().optional().nullable(),
  nome_fr: z.string().optional().nullable(),
  descricao_pt: z.string().optional().nullable(),
  descricao_es: z.string().optional().nullable(),
  descricao_en: z.string().optional().nullable(),
  descricao_fr: z.string().optional().nullable(),
  imagen_portada_url: z.string().optional().nullable(),
  imagenes_galeria: z.string().optional().nullable(),
  duracao: z.string().optional().nullable(),
  tipo_grupo: z.string().optional().nullable(),
  tipo_roteiro: z.enum(['Fixo', 'Flexível']).default('Fixo'),
  is_ativo: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreateGrupoPasseioSchema = z.object({
  slug: z.string().min(1, "Slug é obrigatório"),
  nome_pt: z.string().min(1, "Nome em português é obrigatório"),
  nome_es: z.union([z.string(), z.null(), z.undefined()]).transform(val => val || null),
  nome_en: z.union([z.string(), z.null(), z.undefined()]).transform(val => val || null),
  nome_fr: z.union([z.string(), z.null(), z.undefined()]).transform(val => val || null),
  descricao_pt: z.union([z.string(), z.null(), z.undefined()]).transform(val => val || null),
  descricao_es: z.union([z.string(), z.null(), z.undefined()]).transform(val => val || null),
  descricao_en: z.union([z.string(), z.null(), z.undefined()]).transform(val => val || null),
  descricao_fr: z.union([z.string(), z.null(), z.undefined()]).transform(val => val || null),
  imagen_portada_url: z.union([z.string(), z.null(), z.undefined()]).transform(val => val || null),
  imagenes_galeria: z.union([z.string(), z.null(), z.undefined()]).transform(val => val || null),
  duracao: z.union([z.string(), z.null(), z.undefined()]).transform(val => val || null),
  tipo_grupo: z.union([z.string(), z.null(), z.undefined()]).transform(val => val || null),
  tipo_roteiro: z.enum(['Fixo', 'Flexível']).default('Fixo'),
  is_ativo: z.boolean().default(true),
});

export const UpdateGrupoPasseioSchema = CreateGrupoPasseioSchema.partial();

export type GrupoPasseio = z.infer<typeof GrupoPasseioSchema>;
export type CreateGrupoPasseio = z.infer<typeof CreateGrupoPasseioSchema>;
export type UpdateGrupoPasseio = z.infer<typeof UpdateGrupoPasseioSchema>;

// Serviços (Services) - Now simplified for operations only
export const ServicoSchema = z.object({
  id: z.number(),
  nome: z.string(),
  tipo: z.string(), // Aceita qualquer categoria personalizada
  valor_neto: z.number(),
  valor_venda: z.number().optional().nullable(),
  comissao_valor: z.number(),
  comissao_tipo: z.enum(['%', 'Fixo', 'Margem']),
  modelo_cobranca: z.enum(['Por Pessoa', 'Por Veículo']),
  agencia_id: z.number(),
  grupo_passeio_id: z.number().optional().nullable(),
  tipo_transporte: z.enum(['Buggy', 'Quadriciclo', 'Hilux/Jardineira']).optional().nullable(),
  nome_pt: z.string().optional().nullable(),
  nome_es: z.string().optional().nullable(),
  nome_en: z.string().optional().nullable(),
  nome_fr: z.string().optional().nullable(),
  descricao_comercial: z.string().optional().nullable(),
  descricao_pt: z.string().optional().nullable(),
  descricao_es: z.string().optional().nullable(),
  descricao_en: z.string().optional().nullable(),
  descricao_fr: z.string().optional().nullable(),
  imagen_portada_url: z.string().optional().nullable(),
  imagenes_galeria: z.string().optional().nullable(),
  imagem_url: z.string().optional().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreateServicoSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  tipo: z.string().min(1, "Categoria é obrigatória"), // Aceita qualquer categoria
  valor_neto: z.number().min(0, "Valor deve ser positivo"),
  valor_venda: z.number().min(0, "Valor de venda deve ser positivo").optional(),
  comissao_valor: z.number().min(0, "Comissão deve ser positiva"),
  comissao_tipo: z.enum(['%', 'Fixo', 'Margem']),
  modelo_cobranca: z.enum(['Por Pessoa', 'Por Veículo']),
  agencia_id: z.number().int().positive("Agência é obrigatória"),
  grupo_passeio_id: z.number().optional(),
  tipo_transporte: z.enum(['Buggy', 'Quadriciclo', 'Hilux/Jardineira']).optional(),
});

export const UpdateServicoSchema = z.object({
  nome: z.string().optional(),
  tipo: z.string().min(1).optional(), // Aceita qualquer categoria
  valor_neto: z.number().min(0).optional(),
  valor_venda: z.number().min(0).optional(),
  comissao_valor: z.number().min(0).optional(),
  comissao_tipo: z.enum(['%', 'Fixo', 'Margem']).optional(),
  modelo_cobranca: z.enum(['Por Pessoa', 'Por Veículo']).optional(),
  agencia_id: z.number().optional(),
  grupo_passeio_id: z.number().optional().nullable(),
  tipo_transporte: z.enum(['Buggy', 'Quadriciclo', 'Hilux/Jardineira']).optional().nullable(),
  nome_pt: z.string().optional().nullable(),
  nome_es: z.string().optional().nullable(),
  nome_en: z.string().optional().nullable(),
  nome_fr: z.string().optional().nullable(),
  descricao_comercial: z.string().optional().nullable(),
  descricao_pt: z.string().optional().nullable(),
  descricao_es: z.string().optional().nullable(),
  descricao_en: z.string().optional().nullable(),
  descricao_fr: z.string().optional().nullable(),
  imagen_portada_url: z.string().optional().nullable(),
  imagenes_galeria: z.string().optional().nullable(),
}).partial();

export type Servico = z.infer<typeof ServicoSchema>;
export type CreateServico = z.infer<typeof CreateServicoSchema>;
export type UpdateServico = z.infer<typeof UpdateServicoSchema>;

// Recepcionistas (Receptionists)
export const RecepcionistaSchema = z.object({
  id: z.number(),
  nome: z.string(),
  email: z.string(),
  is_ativo: z.boolean(),
  role: z.enum(['admin', 'staff']).default('staff'),
  password_hash: z.string().optional().nullable(),
  data_contratacao: z.string().optional().nullable(),
  data_demissao: z.string().optional().nullable(),
  data_inicio_comissao: z.string().optional().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreateRecepcionistaSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  senha: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  is_ativo: z.boolean().default(true),
  role: z.enum(['admin', 'staff']).default('staff'),
  data_contratacao: z.string().optional(),
  data_demissao: z.string().optional(),
  data_inicio_comissao: z.string().optional(),
});

export const UpdateRecepcionistaSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório").optional(),
  email: z.string().email("Email inválido").optional(),
  senha: z.string().min(6, "Senha deve ter no mínimo 6 caracteres").optional(),
  is_ativo: z.boolean().optional(),
  role: z.enum(['admin', 'staff']).optional(),
  data_contratacao: z.string().optional(),
  data_demissao: z.string().optional(),
  data_inicio_comissao: z.string().optional(),
}).partial();

export type Recepcionista = z.infer<typeof RecepcionistaSchema>;
export type CreateRecepcionista = z.infer<typeof CreateRecepcionistaSchema>;
export type UpdateRecepcionista = z.infer<typeof UpdateRecepcionistaSchema>;

// Agendamentos (Bookings)
export const AgendamentoSchema = z.object({
  id: z.number(),
  data: z.string(),
  hora: z.string(),
  servico_id: z.number(),
  agencia_id: z.number(),
  recepcionista_id: z.number(),
  hospede_nome: z.string(),
  hospede_idioma: z.enum(['PT', 'ES', 'EN', 'IN']),
  qtd_pessoas: z.number(),
  valor_neto: z.number(),
  valor_total: z.number(),
  valor_sinal: z.number(),
  comissao: z.number(),
  status_comissao: z.enum(['Aberto', 'Liquidada']),
  status: z.enum(['Confirmado', 'Cancelado']).default('Confirmado'),
  status_servico: z.enum(['Agendado', 'Realizado', 'Cancelado']).default('Agendado'),
  agendamento_vinculado_id: z.number().optional().nullable(),
  observacoes: z.string().optional().nullable(),
  numero_voo: z.string().optional().nullable(),
  hora_voo: z.string().optional().nullable(),
  contato_hospede: z.string().optional().nullable(),
  numero_quarto: z.string().optional().nullable(),
  valor_consumido: z.number().optional().nullable(),
  lista_nomes: z.string().optional().nullable(),
  horario_pendente: z.boolean().optional().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreateAgendamentoSchema = z.object({
  data: z.string().min(1, "Data é obrigatória"),
  hora: z.string().min(1, "Hora é obrigatória"),
  servico_id: z.number().int().positive("Serviço é obrigatório"),
  agencia_id: z.number().int().positive("Agência é obrigatória"),
  recepcionista_id: z.number().int().positive("Recepcionista é obrigatório"),
  hospede_nome: z.string().min(1, "Nome do hóspede é obrigatório"),
  hospede_idioma: z.enum(['PT', 'ES', 'EN', 'IN']),
  qtd_pessoas: z.number().int().positive("Quantidade de pessoas deve ser positiva"),
  valor_neto: z.number().min(0, "Valor neto deve ser positivo"),
  valor_total: z.number().min(0, "Valor total deve ser positivo"),
  valor_sinal: z.number().min(0, "Valor sinal deve ser positivo"),
  comissao: z.number().min(0, "Comissão deve ser positiva"),
  status_comissao: z.enum(['Aberto', 'Liquidada']).default('Aberto'),
  status: z.enum(['Confirmado', 'Cancelado']).default('Confirmado'),
  status_servico: z.enum(['Agendado', 'Realizado', 'Cancelado']).default('Agendado'),
  agendamento_vinculado_id: z.number().optional().nullable(),
  observacoes: z.string().optional(),
  numero_voo: z.string().optional(),
  hora_voo: z.string().optional(),
  contato_hospede: z.string().optional(),
  numero_quarto: z.string().optional(),
  valor_consumido: z.number().optional(),
  lista_nomes: z.string().optional(),
  horario_pendente: z.boolean().optional(),
});

export const UpdateAgendamentoSchema = CreateAgendamentoSchema.partial();

export type Agendamento = z.infer<typeof AgendamentoSchema>;
export type CreateAgendamento = z.infer<typeof CreateAgendamentoSchema>;
export type UpdateAgendamento = z.infer<typeof UpdateAgendamentoSchema>;

// Avisos de Turno (Shift Notices)
export const AvisoTurnoSchema = z.object({
  id: z.number(),
  mensaje: z.string(),
  recepcionista_id: z.number(),
  estado: z.enum(['Ativo', 'Resuelto']),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreateAvisoTurnoSchema = z.object({
  mensaje: z.string().min(1, "Mensaje é obrigatório"),
  recepcionista_id: z.number().int().positive("Recepcionista é obrigatório"),
  estado: z.enum(['Ativo', 'Resuelto']).default('Ativo'),
});

export const UpdateAvisoTurnoSchema = CreateAvisoTurnoSchema.partial();

export type AvisoTurno = z.infer<typeof AvisoTurnoSchema>;
export type CreateAvisoTurno = z.infer<typeof CreateAvisoTurnoSchema>;
export type UpdateAvisoTurno = z.infer<typeof UpdateAvisoTurnoSchema>;

// Audit Logs
export const AuditLogSchema = z.object({
  id: z.number(),
  table_name: z.string(),
  record_id: z.number(),
  action: z.enum(['CREATE', 'UPDATE', 'DELETE']),
  performed_by: z.number(),
  details: z.string().optional().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreateAuditLogSchema = z.object({
  table_name: z.string(),
  record_id: z.number(),
  action: z.enum(['CREATE', 'UPDATE', 'DELETE']),
  performed_by: z.number(),
  details: z.string().optional(),
});

export type AuditLog = z.infer<typeof AuditLogSchema>;
export type CreateAuditLog = z.infer<typeof CreateAuditLogSchema>;

// Paradas de Roteiro (Itinerary Stops)
export const ParadaRoteiroSchema = z.object({
  id: z.number(),
  grupo_passeio_id: z.number(),
  ordem: z.number(),
  hora: z.string().optional().nullable(),
  titulo_pt: z.string(),
  titulo_es: z.string().optional().nullable(),
  titulo_en: z.string().optional().nullable(),
  titulo_fr: z.string().optional().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreateParadaRoteiroSchema = z.object({
  grupo_passeio_id: z.number().int().positive("Grupo de passeio é obrigatório"),
  ordem: z.number().int().min(0, "Ordem deve ser positiva"),
  hora: z.string().optional(),
  titulo_pt: z.string().min(1, "Título em português é obrigatório"),
  titulo_es: z.string().optional(),
  titulo_en: z.string().optional(),
  titulo_fr: z.string().optional(),
});

export const UpdateParadaRoteiroSchema = CreateParadaRoteiroSchema.partial();

export type ParadaRoteiro = z.infer<typeof ParadaRoteiroSchema>;
export type CreateParadaRoteiro = z.infer<typeof CreateParadaRoteiroSchema>;
export type UpdateParadaRoteiro = z.infer<typeof UpdateParadaRoteiroSchema>;
