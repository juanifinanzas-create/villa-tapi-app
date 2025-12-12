import { Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import bcrypt from "bcryptjs";
import {
  getOAuthRedirectUrl,
  exchangeCodeForSessionToken,
  getCurrentUser,
  deleteSession,
  authMiddleware,
  MOCHA_SESSION_TOKEN_COOKIE_NAME,
} from "@getmocha/users-service/backend";

const auth = new Hono<{ Bindings: Env }>();

// Google OAuth endpoints
auth.get("/api/oauth/google/redirect_url", async (c) => {
  const redirectUrl = await getOAuthRedirectUrl("google", {
    apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
    apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
  });

  return c.json({ redirectUrl }, 200);
});

auth.post("/api/sessions", async (c) => {
  const body = await c.req.json();

  if (!body.code) {
    return c.json({ error: "No authorization code provided" }, 400);
  }

  const sessionToken = await exchangeCodeForSessionToken(body.code, {
    apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
    apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
  });

  setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: true,
    maxAge: 60 * 24 * 60 * 60, // 60 days
  });

  return c.json({ success: true }, 200);
});

auth.get("/api/users/me", authMiddleware, async (c) => {
  const user = c.get("user");
  
  // Check if user exists in recepcionistas table
  const db = c.env.DB;
  const recepcionista = await db.prepare(
    "SELECT id, nome, email, role, is_ativo FROM recepcionistas WHERE email = ?"
  ).bind(user.email).first() as any;

  if (!recepcionista) {
    // Auto-create recepcionista for new Google users
    const result = await db.prepare(
      "INSERT INTO recepcionistas (nome, email, role, is_ativo) VALUES (?, ?, ?, ?)"
    ).bind(
      user.google_user_data?.name || user.email.split('@')[0],
      user.email,
      'staff',
      1
    ).run();

    const newRecepcionista = await db.prepare(
      "SELECT id, nome, email, role, is_ativo FROM recepcionistas WHERE id = ?"
    ).bind(result.meta.last_row_id).first();

    return c.json({ 
      ...user,
      recepcionista: newRecepcionista
    });
  }

  return c.json({ 
    ...user,
    recepcionista
  });
});

auth.post("/api/logout", async (c) => {
  const sessionToken = getCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME);

  if (typeof sessionToken === "string") {
    await deleteSession(sessionToken, {
      apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
      apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
    });
  }

  setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, "", {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: true,
    maxAge: 0,
  });

  return c.json({ success: true }, 200);
});

// Legacy email/password authentication (keep for existing users)
auth.post("/api/auth/login", async (c) => {
  const db = c.env.DB;
  const { email, senha } = await c.req.json();
  
  if (!email || !senha) {
    return c.json({ message: 'Email e senha são obrigatórios' }, 400);
  }
  
  const recepcionista = await db.prepare(
    "SELECT * FROM recepcionistas WHERE email = ? AND is_ativo = 1"
  ).bind(email).first() as any;
  
  if (!recepcionista) {
    return c.json({ message: 'Email ou senha incorretos' }, 401);
  }
  
  if (recepcionista.password_hash) {
    const isValid = await bcrypt.compare(senha, recepcionista.password_hash);
    if (!isValid) {
      return c.json({ message: 'Email ou senha incorretos' }, 401);
    }
  } else {
    return c.json({ message: 'Use o login com Google ou solicite redefinição de senha' }, 401);
  }
  
  const { password_hash, ...safeRecepcionista } = recepcionista;
  
  return c.json({ recepcionista: safeRecepcionista }, 200);
});

auth.post("/api/auth/register", async (c) => {
  const db = c.env.DB;
  const { nome, email, senha } = await c.req.json();
  
  if (!nome || !email || !senha) {
    return c.json({ message: 'Nome, email e senha são obrigatórios' }, 400);
  }
  
  if (senha.length < 8) {
    return c.json({ message: 'Senha deve ter no mínimo 8 caracteres' }, 400);
  }

  // Validate password strength
  const hasUpperCase = /[A-Z]/.test(senha);
  const hasLowerCase = /[a-z]/.test(senha);
  const hasNumber = /[0-9]/.test(senha);
  
  if (!hasUpperCase || !hasLowerCase || !hasNumber) {
    return c.json({ 
      message: 'Senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número' 
    }, 400);
  }
  
  const existing = await db.prepare(
    "SELECT id FROM recepcionistas WHERE email = ?"
  ).bind(email).first();
  
  if (existing) {
    return c.json({ message: 'Email já cadastrado' }, 400);
  }
  
  const passwordHash = await bcrypt.hash(senha, 10);
  
  const result = await db.prepare(
    "INSERT INTO recepcionistas (nome, email, password_hash, role, is_ativo) VALUES (?, ?, ?, ?, ?)"
  ).bind(nome, email, passwordHash, 'staff', 1).run();
  
  const recepcionista = await db.prepare(
    "SELECT id, nome, email, role, is_ativo, created_at, updated_at FROM recepcionistas WHERE id = ?"
  ).bind(result.meta.last_row_id).first();
  
  return c.json({ recepcionista }, 201);
});

// Password reset endpoints
auth.post("/api/auth/forgot-password", async (c) => {
  const db = c.env.DB;
  const { email } = await c.req.json();
  
  if (!email) {
    return c.json({ message: 'Email é obrigatório' }, 400);
  }
  
  const recepcionista = await db.prepare(
    "SELECT id FROM recepcionistas WHERE email = ?"
  ).bind(email).first();
  
  // Always return success to prevent email enumeration
  // In a real app, you would send an email with a reset token
  return c.json({ 
    message: 'Se este email estiver cadastrado, você receberá instruções para redefinir sua senha' 
  }, 200);
});

auth.post("/api/auth/reset-password", async (c) => {
  const db = c.env.DB;
  const { email, senha, codigo } = await c.req.json();
  
  if (!email || !senha || !codigo) {
    return c.json({ message: 'Email, senha e código são obrigatórios' }, 400);
  }
  
  if (senha.length < 8) {
    return c.json({ message: 'Senha deve ter no mínimo 8 caracteres' }, 400);
  }

  const hasUpperCase = /[A-Z]/.test(senha);
  const hasLowerCase = /[a-z]/.test(senha);
  const hasNumber = /[0-9]/.test(senha);
  
  if (!hasUpperCase || !hasLowerCase || !hasNumber) {
    return c.json({ 
      message: 'Senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número' 
    }, 400);
  }
  
  // For demo purposes, accept a simple code
  // In production, verify a secure token sent by email
  if (codigo !== '123456') {
    return c.json({ message: 'Código inválido' }, 400);
  }
  
  const recepcionista = await db.prepare(
    "SELECT id FROM recepcionistas WHERE email = ?"
  ).bind(email).first() as any;
  
  if (!recepcionista) {
    return c.json({ message: 'Email não encontrado' }, 404);
  }
  
  const passwordHash = await bcrypt.hash(senha, 10);
  
  await db.prepare(
    "UPDATE recepcionistas SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
  ).bind(passwordHash, recepcionista.id).run();
  
  return c.json({ message: 'Senha redefinida com sucesso' }, 200);
});

// Temporary admin password reset endpoint
auth.post("/api/auth/admin-reset", async (c) => {
  const db = c.env.DB;
  const { email, senha, admin_key } = await c.req.json();
  
  // Simple admin key check (in production, use a proper secret)
  if (admin_key !== 'VILLA_TAPI_ADMIN_2025') {
    return c.json({ message: 'Chave de admin inválida' }, 403);
  }
  
  if (!email || !senha) {
    return c.json({ message: 'Email e senha são obrigatórios' }, 400);
  }
  
  const recepcionista = await db.prepare(
    "SELECT id FROM recepcionistas WHERE email = ?"
  ).bind(email).first() as any;
  
  if (!recepcionista) {
    return c.json({ message: 'Email não encontrado' }, 404);
  }
  
  const passwordHash = await bcrypt.hash(senha, 10);
  
  await db.prepare(
    "UPDATE recepcionistas SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
  ).bind(passwordHash, recepcionista.id).run();
  
  return c.json({ message: 'Senha atualizada com sucesso' }, 200);
});

// Update password for logged in user (Meu Perfil)
auth.post("/api/auth/update-password", async (c) => {
  const db = c.env.DB;
  const { recepcionista_id, nova_senha } = await c.req.json();
  
  if (!recepcionista_id || !nova_senha) {
    return c.json({ message: 'ID e nova senha são obrigatórios' }, 400);
  }
  
  if (nova_senha.length < 6) {
    return c.json({ message: 'A senha deve ter no mínimo 6 caracteres' }, 400);
  }
  
  const recepcionista = await db.prepare(
    "SELECT id FROM recepcionistas WHERE id = ?"
  ).bind(recepcionista_id).first() as any;
  
  if (!recepcionista) {
    return c.json({ message: 'Usuário não encontrado' }, 404);
  }
  
  const passwordHash = await bcrypt.hash(nova_senha, 10);
  
  await db.prepare(
    "UPDATE recepcionistas SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
  ).bind(passwordHash, recepcionista_id).run();
  
  return c.json({ message: 'Senha atualizada com sucesso' }, 200);
});

export default auth;
