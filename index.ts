import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { cors } from "hono/cors";
import bcrypt from "bcryptjs";
import auth from "@/worker/auth";
import {
  CreateAgenciaSchema,
  UpdateAgenciaSchema,
  CreateServicoSchema,
  UpdateServicoSchema,
  CreateRecepcionistaSchema,
  UpdateRecepcionistaSchema,
  CreateAgendamentoSchema,
  UpdateAgendamentoSchema,
  CreateGrupoPasseioSchema,
  UpdateGrupoPasseioSchema,
  CreateAvisoTurnoSchema,
  UpdateAvisoTurnoSchema,
  CreateParadaRoteiroSchema,
  UpdateParadaRoteiroSchema,
  type Agencia,
  type Servico,
  type Recepcionista,
  type Agendamento,
  type GrupoPasseio,
  type AvisoTurno,
  type AuditLog,
  type ParadaRoteiro,
} from "@/shared/types";

// Helper function to create audit logs
async function createAuditLog(
  db: D1Database,
  tableName: string,
  recordId: number,
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  performedBy: number,
  details?: string
) {
  await db.prepare(
    "INSERT INTO audit_logs (table_name, record_id, action, performed_by, details) VALUES (?, ?, ?, ?, ?)"
  ).bind(tableName, recordId, action, performedBy, details || null).run();
}

const app = new Hono<{ Bindings: Env }>();

app.use("/*", cors());

// Mount auth routes
app.route("/", auth);

// Image upload endpoint
app.post("/api/upload-image", async (c) => {
  const formData = await c.req.formData();
  const file = formData.get('file') as File;
  
  if (!file) {
    return c.json({ error: 'Nenhum arquivo enviado' }, 400);
  }

  try {
    // Always use data URLs in development (when R2 is not properly configured)
    // Convert file to base64 data URL
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    const dataUrl = `data:${file.type};base64,${base64}`;
    return c.json({ url: dataUrl });
  } catch (error) {
    console.error('Erro ao fazer upload:', error);
    return c.json({ error: 'Erro ao fazer upload da imagem' }, 500);
  }
});

// File serving endpoint - not needed in development, all images are data URLs
app.get("/api/files/*", async (c) => {
  return c.json({ error: 'Arquivos devem ser carregados como data URLs em desenvolvimento' }, 404);
});

// Legacy auth endpoints are in auth.ts

// Agências routes
app.get("/api/agencias", async (c) => {
  const db = c.env.DB;
  const result = await db.prepare("SELECT * FROM agencias ORDER BY nome").all();
  return c.json(result.results as Agencia[]);
});

app.get("/api/agencias/:id", async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");
  const result = await db.prepare("SELECT * FROM agencias WHERE id = ?").bind(id).first();
  
  if (!result) {
    return c.json({ error: "Agência não encontrada" }, 404);
  }
  
  return c.json(result as Agencia);
});

app.post("/api/agencias", zValidator("json", CreateAgenciaSchema), async (c) => {
  const db = c.env.DB;
  const data = c.req.valid("json");
  
  const result = await db.prepare(
    "INSERT INTO agencias (nome, tipo, whatsapp, dados_bancarios, chave_pix, titular_pix) VALUES (?, ?, ?, ?, ?, ?)"
  ).bind(
    data.nome,
    data.tipo,
    data.whatsapp || null,
    data.dados_bancarios || null,
    data.chave_pix || null,
    data.titular_pix || null
  ).run();
  
  const agencia = await db.prepare("SELECT * FROM agencias WHERE id = ?").bind(result.meta.last_row_id).first();
  
  return c.json(agencia as Agencia, 201);
});

app.put("/api/agencias/:id", zValidator("json", UpdateAgenciaSchema), async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");
  const data = c.req.valid("json");
  
  const updates: string[] = [];
  const values: any[] = [];
  
  if (data.nome !== undefined) {
    updates.push("nome = ?");
    values.push(data.nome);
  }
  if (data.tipo !== undefined) {
    updates.push("tipo = ?");
    values.push(data.tipo);
  }
  if (data.whatsapp !== undefined) {
    updates.push("whatsapp = ?");
    values.push(data.whatsapp || null);
  }
  if (data.dados_bancarios !== undefined) {
    updates.push("dados_bancarios = ?");
    values.push(data.dados_bancarios || null);
  }
  if (data.chave_pix !== undefined) {
    updates.push("chave_pix = ?");
    values.push(data.chave_pix || null);
  }
  if (data.titular_pix !== undefined) {
    updates.push("titular_pix = ?");
    values.push(data.titular_pix || null);
  }
  
  updates.push("updated_at = CURRENT_TIMESTAMP");
  values.push(id);
  
  await db.prepare(`UPDATE agencias SET ${updates.join(", ")} WHERE id = ?`).bind(...values).run();
  
  const agencia = await db.prepare("SELECT * FROM agencias WHERE id = ?").bind(id).first();
  
  return c.json(agencia as Agencia);
});

app.delete("/api/agencias/:id", async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");
  
  await db.prepare("DELETE FROM agencias WHERE id = ?").bind(id).run();
  
  return c.json({ success: true });
});

// Grupos de Passeios routes
app.get("/api/grupos-passeios", async (c) => {
  const db = c.env.DB;
  const result = await db.prepare("SELECT * FROM grupos_passeios WHERE is_ativo = 1 ORDER BY nome_pt").all();
  return c.json(result.results as GrupoPasseio[]);
});

app.get("/api/grupos-passeios/:id", async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");
  const result = await db.prepare("SELECT * FROM grupos_passeios WHERE id = ?").bind(id).first();
  
  if (!result) {
    return c.json({ error: "Grupo de passeio não encontrado" }, 404);
  }
  
  return c.json(result as GrupoPasseio);
});

app.get("/api/grupos-passeios/slug/:slug", async (c) => {
  const db = c.env.DB;
  const slug = c.req.param("slug");
  const result = await db.prepare("SELECT * FROM grupos_passeios WHERE slug = ? AND is_ativo = 1").bind(slug).first();
  
  if (!result) {
    return c.json({ error: "Grupo de passeio não encontrado" }, 404);
  }
  
  return c.json(result as GrupoPasseio);
});

app.post("/api/grupos-passeios", zValidator("json", CreateGrupoPasseioSchema), async (c) => {
  const db = c.env.DB;
  const data = c.req.valid("json");
  
  const result = await db.prepare(
    `INSERT INTO grupos_passeios (
      slug, nome_pt, nome_es, nome_en, nome_fr,
      descricao_pt, descricao_es, descricao_en, descricao_fr,
      imagen_portada_url, imagenes_galeria, duracao, tipo_grupo, tipo_roteiro, is_ativo
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    data.slug,
    data.nome_pt,
    data.nome_es || null,
    data.nome_en || null,
    data.nome_fr || null,
    data.descricao_pt || null,
    data.descricao_es || null,
    data.descricao_en || null,
    data.descricao_fr || null,
    data.imagen_portada_url || null,
    data.imagenes_galeria || null,
    data.duracao || null,
    data.tipo_grupo || null,
    data.tipo_roteiro || 'Fixo',
    data.is_ativo ? 1 : 0
  ).run();
  
  const grupo = await db.prepare("SELECT * FROM grupos_passeios WHERE id = ?").bind(result.meta.last_row_id).first();
  
  return c.json(grupo as GrupoPasseio, 201);
});

app.put("/api/grupos-passeios/:id", zValidator("json", UpdateGrupoPasseioSchema), async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");
  const data = c.req.valid("json");
  
  try {
    const updates: string[] = [];
    const values: any[] = [];
    
    if (data.slug !== undefined) {
      updates.push("slug = ?");
      values.push(data.slug);
    }
    if (data.nome_pt !== undefined) {
      updates.push("nome_pt = ?");
      values.push(data.nome_pt);
    }
    if (data.nome_es !== undefined) {
      updates.push("nome_es = ?");
      values.push(data.nome_es || null);
    }
    if (data.nome_en !== undefined) {
      updates.push("nome_en = ?");
      values.push(data.nome_en || null);
    }
    if (data.nome_fr !== undefined) {
      updates.push("nome_fr = ?");
      values.push(data.nome_fr || null);
    }
    if (data.descricao_pt !== undefined) {
      updates.push("descricao_pt = ?");
      values.push(data.descricao_pt || null);
    }
    if (data.descricao_es !== undefined) {
      updates.push("descricao_es = ?");
      values.push(data.descricao_es || null);
    }
    if (data.descricao_en !== undefined) {
      updates.push("descricao_en = ?");
      values.push(data.descricao_en || null);
    }
    if (data.descricao_fr !== undefined) {
      updates.push("descricao_fr = ?");
      values.push(data.descricao_fr || null);
    }
    if (data.imagen_portada_url !== undefined) {
      updates.push("imagen_portada_url = ?");
      values.push(data.imagen_portada_url || null);
    }
    if (data.imagenes_galeria !== undefined) {
      updates.push("imagenes_galeria = ?");
      values.push(data.imagenes_galeria || null);
    }
    if (data.duracao !== undefined) {
      updates.push("duracao = ?");
      values.push(data.duracao || null);
    }
    if (data.tipo_grupo !== undefined) {
      updates.push("tipo_grupo = ?");
      values.push(data.tipo_grupo || null);
    }
    if (data.tipo_roteiro !== undefined) {
      updates.push("tipo_roteiro = ?");
      values.push(data.tipo_roteiro || 'Fixo');
    }
    if (data.is_ativo !== undefined) {
      updates.push("is_ativo = ?");
      values.push(data.is_ativo ? 1 : 0);
    }
    
    updates.push("updated_at = CURRENT_TIMESTAMP");
    values.push(id);
    
    await db.prepare(`UPDATE grupos_passeios SET ${updates.join(", ")} WHERE id = ?`).bind(...values).run();
    
    const grupo = await db.prepare("SELECT * FROM grupos_passeios WHERE id = ?").bind(id).first();
    
    return c.json(grupo as GrupoPasseio);
  } catch (error) {
    console.error('Erro ao atualizar grupo:', error);
    return c.json({ 
      error: 'Erro ao atualizar grupo de passeios',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    }, 500);
  }
});

app.delete("/api/grupos-passeios/:id", async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");
  
  await db.prepare("DELETE FROM grupos_passeios WHERE id = ?").bind(id).run();
  
  return c.json({ success: true });
});

// Serviços routes
app.get("/api/servicos", async (c) => {
  const db = c.env.DB;
  const result = await db.prepare("SELECT * FROM servicos ORDER BY nome").all();
  return c.json(result.results as Servico[]);
});

app.get("/api/servicos/:id", async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");
  const result = await db.prepare("SELECT * FROM servicos WHERE id = ?").bind(id).first();
  
  if (!result) {
    return c.json({ error: "Serviço não encontrado" }, 404);
  }
  
  return c.json(result as Servico);
});

app.post("/api/servicos", zValidator("json", CreateServicoSchema), async (c) => {
  const db = c.env.DB;
  const data = c.req.valid("json");
  
  const result = await db.prepare(
    "INSERT INTO servicos (nome, tipo, valor_neto, valor_venda, comissao_valor, comissao_tipo, modelo_cobranca, agencia_id, tipo_transporte, grupo_passeio_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).bind(
    data.nome,
    data.tipo,
    data.valor_neto,
    data.valor_venda || null,
    data.comissao_valor,
    data.comissao_tipo,
    data.modelo_cobranca,
    data.agencia_id,
    data.tipo_transporte || null,
    data.grupo_passeio_id || null
  ).run();
  
  const servico = await db.prepare("SELECT * FROM servicos WHERE id = ?").bind(result.meta.last_row_id).first();
  
  return c.json(servico as Servico, 201);
});

app.put("/api/servicos/:id", zValidator("json", UpdateServicoSchema), async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");
  const data = c.req.valid("json");
  
  const updates: string[] = [];
  const values: any[] = [];
  
  if (data.nome !== undefined) {
    updates.push("nome = ?");
    values.push(data.nome);
  }
  if (data.tipo !== undefined) {
    updates.push("tipo = ?");
    values.push(data.tipo);
  }
  if (data.valor_neto !== undefined) {
    updates.push("valor_neto = ?");
    values.push(data.valor_neto);
  }
  if (data.valor_venda !== undefined) {
    updates.push("valor_venda = ?");
    values.push(data.valor_venda || null);
  }
  if (data.comissao_valor !== undefined) {
    updates.push("comissao_valor = ?");
    values.push(data.comissao_valor);
  }
  if (data.comissao_tipo !== undefined) {
    updates.push("comissao_tipo = ?");
    values.push(data.comissao_tipo);
  }
  if (data.modelo_cobranca !== undefined) {
    updates.push("modelo_cobranca = ?");
    values.push(data.modelo_cobranca);
  }
  if (data.agencia_id !== undefined) {
    updates.push("agencia_id = ?");
    values.push(data.agencia_id);
  }
  if (data.tipo_transporte !== undefined) {
    updates.push("tipo_transporte = ?");
    values.push(data.tipo_transporte || null);
  }
  if (data.grupo_passeio_id !== undefined) {
    updates.push("grupo_passeio_id = ?");
    values.push(data.grupo_passeio_id || null);
  }
  if (data.nome_pt !== undefined) {
    updates.push("nome_pt = ?");
    values.push(data.nome_pt || null);
  }
  if (data.nome_es !== undefined) {
    updates.push("nome_es = ?");
    values.push(data.nome_es || null);
  }
  if (data.nome_en !== undefined) {
    updates.push("nome_en = ?");
    values.push(data.nome_en || null);
  }
  if (data.nome_fr !== undefined) {
    updates.push("nome_fr = ?");
    values.push(data.nome_fr || null);
  }
  if (data.descricao_comercial !== undefined) {
    updates.push("descricao_comercial = ?");
    values.push(data.descricao_comercial || null);
  }
  if (data.descricao_pt !== undefined) {
    updates.push("descricao_pt = ?");
    values.push(data.descricao_pt || null);
  }
  if (data.descricao_es !== undefined) {
    updates.push("descricao_es = ?");
    values.push(data.descricao_es || null);
  }
  if (data.descricao_en !== undefined) {
    updates.push("descricao_en = ?");
    values.push(data.descricao_en || null);
  }
  if (data.descricao_fr !== undefined) {
    updates.push("descricao_fr = ?");
    values.push(data.descricao_fr || null);
  }
  if (data.imagen_portada_url !== undefined) {
    updates.push("imagen_portada_url = ?");
    values.push(data.imagen_portada_url || null);
  }
  if (data.imagenes_galeria !== undefined) {
    updates.push("imagenes_galeria = ?");
    values.push(data.imagenes_galeria || null);
  }
  
  updates.push("updated_at = CURRENT_TIMESTAMP");
  values.push(id);
  
  await db.prepare(`UPDATE servicos SET ${updates.join(", ")} WHERE id = ?`).bind(...values).run();
  
  const servico = await db.prepare("SELECT * FROM servicos WHERE id = ?").bind(id).first();
  
  return c.json(servico as Servico);
});

app.delete("/api/servicos/:id", async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");
  
  await db.prepare("DELETE FROM servicos WHERE id = ?").bind(id).run();
  
  return c.json({ success: true });
});

// Recepcionistas routes
app.get("/api/recepcionistas", async (c) => {
  const db = c.env.DB;
  const result = await db.prepare("SELECT id, nome, email, role, is_ativo, data_contratacao, data_demissao, data_inicio_comissao, created_at, updated_at FROM recepcionistas ORDER BY nome").all();
  return c.json(result.results as Recepcionista[]);
});

app.get("/api/recepcionistas/:id", async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");
  const result = await db.prepare("SELECT id, nome, email, role, is_ativo, data_contratacao, data_demissao, data_inicio_comissao, created_at, updated_at FROM recepcionistas WHERE id = ?").bind(id).first();
  
  if (!result) {
    return c.json({ error: "Recepcionista não encontrado" }, 404);
  }
  
  return c.json(result as Recepcionista);
});

app.post("/api/recepcionistas", zValidator("json", CreateRecepcionistaSchema), async (c) => {
  const db = c.env.DB;
  
  try {
    const data = c.req.valid("json");
    
    console.log('Creating recepcionista with data:', {
      ...data,
      senha: data.senha ? '***' : undefined,
    });
    
    // Check if email already exists
    const existing = await db.prepare(
      "SELECT id FROM recepcionistas WHERE email = ?"
    ).bind(data.email).first();
    
    if (existing) {
      return c.json({ error: 'Email já cadastrado' }, 400);
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(data.senha, 10);
    
    // Set default data_contratacao to today if not provided
    const dataContratacao = data.data_contratacao || new Date().toISOString().split('T')[0];
    
    // Ensure dates are properly null if not provided (not empty strings)
    const dataDemissao = data.data_demissao || null;
    const dataInicioComissao = data.data_inicio_comissao || null;
    
    console.log('Inserting with dates:', { dataContratacao, dataDemissao, dataInicioComissao });
    
    const result = await db.prepare(
      "INSERT INTO recepcionistas (nome, email, password_hash, role, is_ativo, data_contratacao, data_demissao, data_inicio_comissao) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(
      data.nome, 
      data.email, 
      passwordHash, 
      data.role || 'staff', 
      data.is_ativo ? 1 : 0,
      dataContratacao,
      dataDemissao,
      dataInicioComissao
    ).run();
    
    const recepcionista = await db.prepare(
      "SELECT id, nome, email, role, is_ativo, data_contratacao, data_demissao, data_inicio_comissao, created_at, updated_at FROM recepcionistas WHERE id = ?"
    ).bind(result.meta.last_row_id).first();
    
    return c.json(recepcionista as Recepcionista, 201);
  } catch (error) {
    console.error('Error creating recepcionista:', error);
    return c.json({ 
      error: 'Erro ao criar recepcionista',
      message: error instanceof Error ? error.message : String(error),
      details: error
    }, 500);
  }
});

app.put("/api/recepcionistas/:id", zValidator("json", UpdateRecepcionistaSchema), async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");
  
  try {
    const data = c.req.valid("json");
    
    console.log('Updating recepcionista with data:', {
      ...data,
      senha: data.senha ? '***' : undefined,
    });
    
    const updates: string[] = [];
    const values: any[] = [];
    
    if (data.nome !== undefined) {
      updates.push("nome = ?");
      values.push(data.nome);
    }
    if (data.email !== undefined) {
      // Check if email is already used by another user
      const existing = await db.prepare(
        "SELECT id FROM recepcionistas WHERE email = ? AND id != ?"
      ).bind(data.email, id).first();
      
      if (existing) {
        return c.json({ error: 'Email já está em uso' }, 400);
      }
      
      updates.push("email = ?");
      values.push(data.email);
    }
    if (data.senha !== undefined && data.senha.trim() !== '') {
      // Hash new password only if it's not empty
      const passwordHash = await bcrypt.hash(data.senha, 10);
      updates.push("password_hash = ?");
      values.push(passwordHash);
    }
    if (data.is_ativo !== undefined) {
      updates.push("is_ativo = ?");
      values.push(data.is_ativo ? 1 : 0);
    }
    if (data.role !== undefined) {
      updates.push("role = ?");
      values.push(data.role);
    }
    if (data.data_contratacao !== undefined) {
      updates.push("data_contratacao = ?");
      values.push(data.data_contratacao || null);
    }
    if (data.data_demissao !== undefined) {
      updates.push("data_demissao = ?");
      values.push(data.data_demissao || null);
    }
    if (data.data_inicio_comissao !== undefined) {
      updates.push("data_inicio_comissao = ?");
      values.push(data.data_inicio_comissao || null);
    }
    
    if (updates.length > 0) {
      updates.push("updated_at = CURRENT_TIMESTAMP");
      values.push(id);
      
      console.log('Executing UPDATE with values:', values);
      
      await db.prepare(`UPDATE recepcionistas SET ${updates.join(", ")} WHERE id = ?`).bind(...values).run();
    }
    
    const recepcionista = await db.prepare(
      "SELECT id, nome, email, role, is_ativo, data_contratacao, data_demissao, data_inicio_comissao, created_at, updated_at FROM recepcionistas WHERE id = ?"
    ).bind(id).first();
    
    return c.json(recepcionista as Recepcionista);
  } catch (error) {
    console.error('Error updating recepcionista:', error);
    return c.json({ 
      error: 'Erro ao atualizar recepcionista',
      message: error instanceof Error ? error.message : String(error),
      details: error
    }, 500);
  }
});

app.delete("/api/recepcionistas/:id", async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");
  
  await db.prepare("DELETE FROM recepcionistas WHERE id = ?").bind(id).run();
  
  return c.json({ success: true });
});

// Agendamentos routes
app.get("/api/agendamentos", async (c) => {
  const db = c.env.DB;
  const result = await db.prepare("SELECT * FROM agendamentos ORDER BY data DESC, hora DESC").all();
  return c.json(result.results as Agendamento[]);
});

app.get("/api/agendamentos/:id", async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");
  const result = await db.prepare("SELECT * FROM agendamentos WHERE id = ?").bind(id).first();
  
  if (!result) {
    return c.json({ error: "Agendamento não encontrado" }, 404);
  }
  
  return c.json(result as Agendamento);
});

app.post("/api/agendamentos", zValidator("json", CreateAgendamentoSchema), async (c) => {
  const db = c.env.DB;
  const data = c.req.valid("json");
  
  const result = await db.prepare(
    `INSERT INTO agendamentos (
      data, hora, servico_id, agencia_id, recepcionista_id,
      hospede_nome, hospede_idioma, qtd_pessoas,
      valor_neto, valor_total, valor_sinal, comissao,
      status_comissao, status, status_servico, agendamento_vinculado_id, observacoes,
      numero_voo, hora_voo, contato_hospede, numero_quarto, valor_consumido, lista_nomes, horario_pendente
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    data.data,
    data.hora,
    data.servico_id,
    data.agencia_id,
    data.recepcionista_id,
    data.hospede_nome,
    data.hospede_idioma,
    data.qtd_pessoas,
    data.valor_neto,
    data.valor_total,
    data.valor_sinal,
    data.comissao,
    data.status_comissao || 'Aberto',
    data.status || 'Confirmado',
    data.status_servico || 'Agendado',
    data.agendamento_vinculado_id || null,
    data.observacoes || null,
    data.numero_voo || null,
    data.hora_voo || null,
    data.contato_hospede || null,
    data.numero_quarto || null,
    data.valor_consumido || null,
    data.lista_nomes || null,
    data.horario_pendente ? 1 : 0
  ).run();
  
  const agendamento = await db.prepare("SELECT * FROM agendamentos WHERE id = ?").bind(result.meta.last_row_id).first();
  
  // Create audit log
  await createAuditLog(
    db,
    'agendamentos',
    result.meta.last_row_id,
    'CREATE',
    data.recepcionista_id,
    `Agendamento criado para ${data.hospede_nome}`
  );
  
  return c.json(agendamento as Agendamento, 201);
});

app.put("/api/agendamentos/:id", zValidator("json", UpdateAgendamentoSchema), async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");
  const data = c.req.valid("json");
  
  // Get the old record to track changes
  const oldRecord = await db.prepare("SELECT * FROM agendamentos WHERE id = ?").bind(id).first() as any;
  
  const updates: string[] = [];
  const values: any[] = [];
  const changes: string[] = [];
  
  if (data.data !== undefined && data.data !== oldRecord.data) {
    updates.push("data = ?");
    values.push(data.data);
    changes.push(`Data: ${oldRecord.data} → ${data.data}`);
  }
  if (data.hora !== undefined && data.hora !== oldRecord.hora) {
    updates.push("hora = ?");
    values.push(data.hora);
    changes.push(`Hora: ${oldRecord.hora} → ${data.hora}`);
  }
  if (data.servico_id !== undefined && data.servico_id !== oldRecord.servico_id) {
    updates.push("servico_id = ?");
    values.push(data.servico_id);
    changes.push(`Serviço alterado`);
  }
  if (data.agencia_id !== undefined && data.agencia_id !== oldRecord.agencia_id) {
    updates.push("agencia_id = ?");
    values.push(data.agencia_id);
    changes.push(`Agência alterada`);
  }
  if (data.recepcionista_id !== undefined && data.recepcionista_id !== oldRecord.recepcionista_id) {
    updates.push("recepcionista_id = ?");
    values.push(data.recepcionista_id);
    changes.push(`Recepcionista alterado`);
  }
  if (data.hospede_nome !== undefined && data.hospede_nome !== oldRecord.hospede_nome) {
    updates.push("hospede_nome = ?");
    values.push(data.hospede_nome);
    changes.push(`Nome: ${oldRecord.hospede_nome} → ${data.hospede_nome}`);
  }
  if (data.hospede_idioma !== undefined && data.hospede_idioma !== oldRecord.hospede_idioma) {
    updates.push("hospede_idioma = ?");
    values.push(data.hospede_idioma);
    changes.push(`Idioma: ${oldRecord.hospede_idioma} → ${data.hospede_idioma}`);
  }
  if (data.qtd_pessoas !== undefined && data.qtd_pessoas !== oldRecord.qtd_pessoas) {
    updates.push("qtd_pessoas = ?");
    values.push(data.qtd_pessoas);
    changes.push(`Pessoas: ${oldRecord.qtd_pessoas} → ${data.qtd_pessoas}`);
  }
  if (data.valor_neto !== undefined && data.valor_neto !== oldRecord.valor_neto) {
    updates.push("valor_neto = ?");
    values.push(data.valor_neto);
    changes.push(`Valor Neto: R$ ${oldRecord.valor_neto} → R$ ${data.valor_neto}`);
  }
  if (data.valor_total !== undefined && data.valor_total !== oldRecord.valor_total) {
    updates.push("valor_total = ?");
    values.push(data.valor_total);
    changes.push(`Valor Total: R$ ${oldRecord.valor_total} → R$ ${data.valor_total}`);
  }
  if (data.valor_sinal !== undefined && data.valor_sinal !== oldRecord.valor_sinal) {
    updates.push("valor_sinal = ?");
    values.push(data.valor_sinal);
    changes.push(`Sinal: R$ ${oldRecord.valor_sinal} → R$ ${data.valor_sinal}`);
  }
  if (data.comissao !== undefined && data.comissao !== oldRecord.comissao) {
    updates.push("comissao = ?");
    values.push(data.comissao);
    changes.push(`Comissão: R$ ${oldRecord.comissao} → R$ ${data.comissao}`);
  }
  if (data.status_comissao !== undefined && data.status_comissao !== oldRecord.status_comissao) {
    updates.push("status_comissao = ?");
    values.push(data.status_comissao);
    changes.push(`Status Comissão: ${oldRecord.status_comissao} → ${data.status_comissao}`);
  }
  if (data.status !== undefined && data.status !== oldRecord.status) {
    updates.push("status = ?");
    values.push(data.status);
    changes.push(`Status: ${oldRecord.status} → ${data.status}`);
  }
  if (data.status_servico !== undefined && data.status_servico !== oldRecord.status_servico) {
    updates.push("status_servico = ?");
    values.push(data.status_servico);
    changes.push(`Status Serviço: ${oldRecord.status_servico} → ${data.status_servico}`);
  }
  if (data.agendamento_vinculado_id !== undefined) {
    updates.push("agendamento_vinculado_id = ?");
    values.push(data.agendamento_vinculado_id || null);
  }
  if (data.observacoes !== undefined) {
    updates.push("observacoes = ?");
    values.push(data.observacoes || null);
  }
  if (data.numero_voo !== undefined) {
    updates.push("numero_voo = ?");
    values.push(data.numero_voo || null);
  }
  if (data.hora_voo !== undefined) {
    updates.push("hora_voo = ?");
    values.push(data.hora_voo || null);
  }
  if (data.contato_hospede !== undefined) {
    updates.push("contato_hospede = ?");
    values.push(data.contato_hospede || null);
  }
  if (data.numero_quarto !== undefined) {
    updates.push("numero_quarto = ?");
    values.push(data.numero_quarto || null);
  }
  if (data.valor_consumido !== undefined) {
    updates.push("valor_consumido = ?");
    values.push(data.valor_consumido || null);
    if (data.valor_consumido && data.valor_consumido !== oldRecord.valor_consumido) {
      changes.push(`Valor Consumido: R$ ${oldRecord.valor_consumido || 0} → R$ ${data.valor_consumido}`);
    }
  }
  if (data.lista_nomes !== undefined) {
    updates.push("lista_nomes = ?");
    values.push(data.lista_nomes || null);
  }
  if (data.horario_pendente !== undefined) {
    updates.push("horario_pendente = ?");
    values.push(data.horario_pendente ? 1 : 0);
    if (data.horario_pendente !== oldRecord.horario_pendente) {
      changes.push(`Horário Pendente: ${oldRecord.horario_pendente ? 'Sim' : 'Não'} → ${data.horario_pendente ? 'Sim' : 'Não'}`);
    }
  }
  
  if (updates.length > 0) {
    updates.push("updated_at = CURRENT_TIMESTAMP");
    values.push(id);
    
    await db.prepare(`UPDATE agendamentos SET ${updates.join(", ")} WHERE id = ?`).bind(...values).run();
    
    // Create audit log if there were actual changes
    if (changes.length > 0) {
      const performedBy = data.recepcionista_id || oldRecord.recepcionista_id;
      await createAuditLog(
        db,
        'agendamentos',
        Number(id),
        'UPDATE',
        performedBy,
        changes.join('; ')
      );
    }
  }
  
  const agendamento = await db.prepare("SELECT * FROM agendamentos WHERE id = ?").bind(id).first();
  
  return c.json(agendamento as Agendamento);
});

app.delete("/api/agendamentos/:id", async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");
  
  // Get the record before deletion
  const record = await db.prepare("SELECT * FROM agendamentos WHERE id = ?").bind(id).first() as any;
  
  if (record) {
    // Create audit log before deleting
    await createAuditLog(
      db,
      'agendamentos',
      Number(id),
      'DELETE',
      record.recepcionista_id,
      `Agendamento excluído: ${record.hospede_nome}`
    );
  }
  
  await db.prepare("DELETE FROM agendamentos WHERE id = ?").bind(id).run();
  
  return c.json({ success: true });
});

// Avisos de Turno routes
app.get("/api/avisos-turno", async (c) => {
  const db = c.env.DB;
  const result = await db.prepare(
    "SELECT * FROM avisos_turno WHERE estado = 'Ativo' ORDER BY created_at DESC LIMIT 10"
  ).all();
  return c.json(result.results as AvisoTurno[]);
});

app.get("/api/avisos-turno/:id", async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");
  const result = await db.prepare("SELECT * FROM avisos_turno WHERE id = ?").bind(id).first();
  
  if (!result) {
    return c.json({ error: "Aviso não encontrado" }, 404);
  }
  
  return c.json(result as AvisoTurno);
});

app.post("/api/avisos-turno", zValidator("json", CreateAvisoTurnoSchema), async (c) => {
  const db = c.env.DB;
  const data = c.req.valid("json");
  
  const result = await db.prepare(
    "INSERT INTO avisos_turno (mensaje, recepcionista_id, estado) VALUES (?, ?, ?)"
  ).bind(
    data.mensaje,
    data.recepcionista_id,
    data.estado || 'Ativo'
  ).run();
  
  const aviso = await db.prepare("SELECT * FROM avisos_turno WHERE id = ?").bind(result.meta.last_row_id).first();
  
  return c.json(aviso as AvisoTurno, 201);
});

app.put("/api/avisos-turno/:id", zValidator("json", UpdateAvisoTurnoSchema), async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");
  const data = c.req.valid("json");
  
  const updates: string[] = [];
  const values: any[] = [];
  
  if (data.mensaje !== undefined) {
    updates.push("mensaje = ?");
    values.push(data.mensaje);
  }
  if (data.recepcionista_id !== undefined) {
    updates.push("recepcionista_id = ?");
    values.push(data.recepcionista_id);
  }
  if (data.estado !== undefined) {
    updates.push("estado = ?");
    values.push(data.estado);
  }
  
  updates.push("updated_at = CURRENT_TIMESTAMP");
  values.push(id);
  
  await db.prepare(`UPDATE avisos_turno SET ${updates.join(", ")} WHERE id = ?`).bind(...values).run();
  
  const aviso = await db.prepare("SELECT * FROM avisos_turno WHERE id = ?").bind(id).first();
  
  return c.json(aviso as AvisoTurno);
});

app.delete("/api/avisos-turno/:id", async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");
  
  await db.prepare("DELETE FROM avisos_turno WHERE id = ?").bind(id).run();
  
  return c.json({ success: true });
});

// Audit Logs routes
app.get("/api/audit-logs", async (c) => {
  const db = c.env.DB;
  const url = new URL(c.req.url);
  const table = url.searchParams.get('table');
  const action = url.searchParams.get('action');
  const performedBy = url.searchParams.get('performedBy');
  const limit = url.searchParams.get('limit') || '100';
  
  let query = "SELECT * FROM audit_logs WHERE 1=1";
  const bindings: any[] = [];
  
  if (table) {
    query += " AND table_name = ?";
    bindings.push(table);
  }
  
  if (action) {
    query += " AND action = ?";
    bindings.push(action);
  }
  
  if (performedBy) {
    query += " AND performed_by = ?";
    bindings.push(Number(performedBy));
  }
  
  query += " ORDER BY created_at DESC LIMIT ?";
  bindings.push(Number(limit));
  
  const result = await db.prepare(query).bind(...bindings).all();
  
  return c.json(result.results as AuditLog[]);
});

app.get("/api/audit-logs/agendamentos/:id", async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");
  
  const result = await db.prepare(
    "SELECT * FROM audit_logs WHERE table_name = 'agendamentos' AND record_id = ? ORDER BY created_at DESC"
  ).bind(id).all();
  
  return c.json(result.results as AuditLog[]);
});

// Paradas de Roteiro routes
app.get("/api/paradas-roteiro/grupo/:grupoId", async (c) => {
  const db = c.env.DB;
  const grupoId = c.req.param("grupoId");
  const result = await db.prepare(
    "SELECT * FROM paradas_roteiro WHERE grupo_passeio_id = ? ORDER BY ordem"
  ).bind(grupoId).all();
  return c.json(result.results as ParadaRoteiro[]);
});

app.post("/api/paradas-roteiro", zValidator("json", CreateParadaRoteiroSchema), async (c) => {
  const db = c.env.DB;
  const data = c.req.valid("json");
  
  const result = await db.prepare(
    `INSERT INTO paradas_roteiro (
      grupo_passeio_id, ordem, hora, titulo_pt, titulo_es, titulo_en, titulo_fr
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    data.grupo_passeio_id,
    data.ordem,
    data.hora || null,
    data.titulo_pt,
    data.titulo_es || null,
    data.titulo_en || null,
    data.titulo_fr || null
  ).run();
  
  const parada = await db.prepare("SELECT * FROM paradas_roteiro WHERE id = ?").bind(result.meta.last_row_id).first();
  
  return c.json(parada as ParadaRoteiro, 201);
});

app.put("/api/paradas-roteiro/:id", zValidator("json", UpdateParadaRoteiroSchema), async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");
  const data = c.req.valid("json");
  
  const updates: string[] = [];
  const values: any[] = [];
  
  if (data.grupo_passeio_id !== undefined) {
    updates.push("grupo_passeio_id = ?");
    values.push(data.grupo_passeio_id);
  }
  if (data.ordem !== undefined) {
    updates.push("ordem = ?");
    values.push(data.ordem);
  }
  if (data.hora !== undefined) {
    updates.push("hora = ?");
    values.push(data.hora || null);
  }
  if (data.titulo_pt !== undefined) {
    updates.push("titulo_pt = ?");
    values.push(data.titulo_pt);
  }
  if (data.titulo_es !== undefined) {
    updates.push("titulo_es = ?");
    values.push(data.titulo_es || null);
  }
  if (data.titulo_en !== undefined) {
    updates.push("titulo_en = ?");
    values.push(data.titulo_en || null);
  }
  if (data.titulo_fr !== undefined) {
    updates.push("titulo_fr = ?");
    values.push(data.titulo_fr || null);
  }
  
  if (updates.length > 0) {
    updates.push("updated_at = CURRENT_TIMESTAMP");
    values.push(id);
    
    await db.prepare(`UPDATE paradas_roteiro SET ${updates.join(", ")} WHERE id = ?`).bind(...values).run();
  }
  
  const parada = await db.prepare("SELECT * FROM paradas_roteiro WHERE id = ?").bind(id).first();
  
  return c.json(parada as ParadaRoteiro);
});

app.delete("/api/paradas-roteiro/:id", async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");
  
  await db.prepare("DELETE FROM paradas-roteiro WHERE id = ?").bind(id).run();
  
  return c.json({ success: true });
});

export default app;
