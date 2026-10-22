import React, { createContext, useContext, useEffect, useState } from "react";
import {
  authClient,
  NEON_AUTH_URL,
  UserSession,
  saveLocalSession,
  getLocalSession,
  clearLocalSession,
  mapAuthErrorMessage,
} from "@/lib/auth";
import { getOrCreateNutricionista } from "@/lib/db";

interface AuthContextType {
  user: UserSession | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(() => getLocalSession());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize and check session on startup
  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      try {
        // Try better-auth getSession first
        const sessionRes = await authClient.getSession();
        if (sessionRes?.data?.user && isMounted) {
          const u: UserSession = {
            id: sessionRes.data.user.id,
            name: sessionRes.data.user.name || "Nutricionista",
            email: sessionRes.data.user.email,
            createdAt: sessionRes.data.user.createdAt ? new Date(sessionRes.data.user.createdAt).toISOString() : undefined,
          };
          setUser(u);
          saveLocalSession(u);
          setIsLoading(false);
          return;
        }
      } catch (err) {
        console.warn("Neon auth getSession note:", err);
      }

      // If local session exists, preserve it
      const cached = getLocalSession();
      if (cached && isMounted) {
        setUser(cached);
      }

      if (isMounted) {
        setIsLoading(false);
      }
    }

    checkSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const signup = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      // 1. Attempt via Better Auth client
      let userObj: UserSession | null = null;
      let token: string | undefined = undefined;

      try {
        const res = await authClient.signUp.email({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password: password,
        });

        if (res?.error) {
          throw new Error(res.error.message || "Erro ao realizar cadastro.");
        }

        if (res?.data?.user) {
          userObj = {
            id: res.data.user.id,
            name: res.data.user.name || name.trim(),
            email: res.data.user.email,
            createdAt: res.data.user.createdAt ? new Date(res.data.user.createdAt).toISOString() : new Date().toISOString(),
          };
          if (res.data.token) {
            token = res.data.token;
          }
        }
      } catch (clientErr: any) {
        // Direct REST fallback if needed
        const directRes = await fetch(`${NEON_AUTH_URL}/sign-up/email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            password,
          }),
        });

        const json = await directRes.json().catch(() => ({}));
        if (!directRes.ok) {
          throw new Error(json?.message || json?.error?.message || "Erro ao realizar cadastro no servidor");
        }

        if (json?.user) {
          userObj = {
            id: json.user.id,
            name: json.user.name || name.trim(),
            email: json.user.email,
            createdAt: json.user.createdAt || new Date().toISOString(),
          };
          token = json.token || json.session?.token;
        }
      }

      if (userObj) {
        // Sync with `nutricionistas` table in Neon
        try {
          await getOrCreateNutricionista(userObj.id, userObj.email, userObj.name);
        } catch (dbErr) {
          console.warn("Could not sync nutricionista in database:", dbErr);
        }

        setUser(userObj);
        saveLocalSession(userObj, token);
        setIsLoading(false);
        return { success: true };
      }

      throw new Error("Não foi possível obter os dados do usuário após o cadastro.");
    } catch (err: any) {
      setIsLoading(false);
      const friendlyMessage = mapAuthErrorMessage(err);
      return { success: false, error: friendlyMessage };
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      let userObj: UserSession | null = null;
      let token: string | undefined = undefined;

      try {
        const res = await authClient.signIn.email({
          email: email.trim().toLowerCase(),
          password: password,
        });

        if (res?.error) {
          throw new Error(res.error.message || "Email ou senha inválidos.");
        }

        if (res?.data?.user) {
          userObj = {
            id: res.data.user.id,
            name: res.data.user.name || "Nutricionista",
            email: res.data.user.email,
            createdAt: res.data.user.createdAt ? new Date(res.data.user.createdAt).toISOString() : undefined,
          };
          if (res.data.token) {
            token = res.data.token;
          }
        }
      } catch (clientErr: any) {
        // Direct REST fallback
        const directRes = await fetch(`${NEON_AUTH_URL}/sign-in/email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            password,
          }),
        });

        const json = await directRes.json().catch(() => ({}));
        if (!directRes.ok) {
          throw new Error(json?.message || json?.error?.message || "Credenciais inválidas");
        }

        if (json?.user) {
          userObj = {
            id: json.user.id,
            name: json.user.name || "Nutricionista",
            email: json.user.email,
            createdAt: json.user.createdAt,
          };
          token = json.token || json.session?.token;
        }
      }

      if (userObj) {
        // Sync with `nutricionistas` table in Neon
        try {
          await getOrCreateNutricionista(userObj.id, userObj.email, userObj.name);
        } catch (dbErr) {
          console.warn("Could not sync nutricionista in database:", dbErr);
        }

        setUser(userObj);
        saveLocalSession(userObj, token);
        setIsLoading(false);
        return { success: true };
      }

      throw new Error("Não foi possível autenticar o usuário.");
    } catch (err: any) {
      setIsLoading(false);
      const friendlyMessage = mapAuthErrorMessage(err);
      return { success: false, error: friendlyMessage };
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authClient.signOut().catch(() => null);
      await fetch(`${NEON_AUTH_URL}/sign-out`, {
        method: "POST",
        credentials: "include",
      }).catch(() => null);
    } finally {
      clearLocalSession();
      setUser(null);
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
};
