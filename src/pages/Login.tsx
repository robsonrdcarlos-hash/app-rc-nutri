import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Logo } from "@/components/ui/Logo";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Mail, Lock, Sparkles, ShieldCheck, HeartPulse } from "lucide-react";

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!email.trim() || !password) {
      setErrorMessage("Por favor, preencha o email e a senha.");
      return;
    }

    setIsSubmitting(true);
    const result = await login(email, password);
    setIsSubmitting(false);

    if (result.success) {
      const from = (location.state as any)?.from?.pathname || "/dashboard";
      navigate(from, { replace: true });
    } else {
      setErrorMessage(result.error || "Email ou senha incorretos.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/20 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Subtle background decorative shapes */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-teal-200/20 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        {/* Top Logo */}
        <Logo size="lg" showTagline={true} className="mb-6" />

        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Acesse sua conta
        </h1>
        <p className="mt-1.5 text-sm text-slate-600">
          Gerencie seus pacientes e consultas com praticidade
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4 sm:px-0">
        <div className="bg-white/90 backdrop-blur-xl py-8 px-6 shadow-xl shadow-slate-200/60 sm:rounded-2xl sm:px-10 border border-slate-100 ring-1 ring-slate-900/5">
          {errorMessage && (
            <div className="mb-5">
              <Alert type="error" message={errorMessage} />
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            <Input
              id="login-email"
              label="Email profissional"
              type="email"
              autoComplete="email"
              placeholder="exemplo@nutricao.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="h-4 w-4" />}
              required
            />

            <div className="space-y-1">
              <Input
                id="login-password"
                label="Senha"
                isPassword
                autoComplete="current-password"
                placeholder="Sua senha de acesso"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="h-4 w-4" />}
                required
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              isLoading={isSubmitting}
            >
              Entrar
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-600">
              Não tem conta?{" "}
              <Link
                to="/register"
                className="font-semibold text-emerald-600 hover:text-emerald-700 hover:underline transition-colors"
              >
                Cadastre-se
              </Link>
            </p>
          </div>
        </div>

        {/* Feature badges footer */}
        <div className="mt-8 grid grid-cols-3 gap-2 text-center text-[11px] font-medium text-slate-500">
          <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-white/60 border border-slate-200/60 shadow-sm">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Dados Seguros</span>
          </div>
          <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-white/60 border border-slate-200/60 shadow-sm">
            <HeartPulse className="h-4 w-4 text-emerald-600" />
            <span>Foco Clínico</span>
          </div>
          <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-white/60 border border-slate-200/60 shadow-sm">
            <Sparkles className="h-4 w-4 text-emerald-600" />
            <span>100% Online</span>
          </div>
        </div>
      </div>
    </div>
  );
};
