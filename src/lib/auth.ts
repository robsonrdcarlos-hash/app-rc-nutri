import { createAuthClient } from "better-auth/react";

export const NEON_AUTH_URL = import.meta.env.VITE_NEON_AUTH_URL || "";

export const authClient = createAuthClient({
  baseURL: NEON_AUTH_URL,
});

export interface UserSession {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
  token?: string;
}

const LOCAL_STORAGE_KEY = "rc_nutri_auth_session";

export function saveLocalSession(user: UserSession, token?: string) {
  try {
    const dataToSave = { ...user, token: token || user.token };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToSave));
  } catch (e) {
    console.error("Failed to save session to localStorage", e);
  }
}

export function getLocalSession(): UserSession | null {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch (e) {
    console.error("Failed to read session from localStorage", e);
    return null;
  }
}

export function clearLocalSession() {
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  } catch (e) {
    console.error("Failed to remove session", e);
  }
}

export function mapAuthErrorMessage(error: any): string {
  if (!error) return "Ocorreu um erro inesperado. Tente novamente.";
  const msg = (error.message || error.statusText || error.error || error.toString() || "").toLowerCase();

  if (msg.includes("already exists") || msg.includes("user already exists") || msg.includes("duplicate") || msg.includes("409")) {
    return "Já existe uma conta cadastrada com este email. Faça login ou use outro email.";
  }
  if (msg.includes("invalid password") || msg.includes("invalid email or password") || msg.includes("credentials") || msg.includes("unauthorized") || msg.includes("401")) {
    return "Email ou senha incorretos. Verifique seus dados e tente novamente.";
  }
  if (msg.includes("password is too short") || msg.includes("minimum 9 characters") || msg.includes("short")) {
    return "A senha deve ter pelo menos 9 caracteres.";
  }
  if (msg.includes("invalid email") || msg.includes("valid email")) {
    return "Por favor, insira um endereço de email válido.";
  }
  if (msg.includes("failed to fetch") || msg.includes("network") || msg.includes("cors")) {
    return "Falha de conexão com o servidor de autenticação. Verifique sua internet.";
  }
  if (msg.includes("403") || msg.includes("forbidden")) {
    return "Acesso não autorizado pelo servidor de autenticação (origem não permitida ou credenciais bloqueadas).";
  }
  return error.message || "Não foi possível concluir a operação. Verifique os dados inseridos.";
}
