import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Logo } from "@/components/ui/Logo";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { User, Mail, Lock, ShieldCheck } from "lucide-react";

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Client validation
  const validate = (): string | null => {
    if (!nome.trim()) {
      return "Informe seu nome completo.";
    }
    if (nome.trim().length < 3) {
      return "O nome deve ter no mínimo 3 caracteres.";
    }
    if (!email.trim() || !email.includes("@") || !email.includes(".")) {
      return "Informe um email válido.";
    }
    if (!password) {
      return "Informe uma senha.";
    }
    if (password.length < 9) {
      return "A senha deve ter no mínimo 9 caracteres.";
    }
    if (password !== confirmPassword) {
      return "As senhas não coincidem. Verifique a confirmação.";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const validationError = validate();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsSubmitting(true);
    const result = await signup(nome, email, password);
    setIsSubmitting(false);

    if (result.success) {
      navigate("/dashboard", { replace: true });
    } else {
      setErrorMessage(result.error || "Erro ao criar conta.");
    }
  };

  const isPasswordLengthValid = password.length >= 9;
  const doPasswordsMatch = password.length > 0 && password === confirmPassword;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/20 flex flex-col justify-center py-10 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-teal-200/20 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        {/* Top Logo */}
        <Logo size="lg" showTagline={true} className="mb-5" />

        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Crie sua conta profissional
        </h1>
        <p className="mt-1.5 text-sm text-slate-600">
          Comece a transformar a gestão dos seus atendimentos
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4 sm:px-0">
        <div className="bg-white/90 backdrop-blur-xl py-8 px-6 shadow-xl shadow-slate-200/60 sm:rounded-2xl sm:px-10 border border-slate-100 ring-1 ring-slate-900/5">
          {errorMessage && (
            <div className="mb-5">
              <Alert type="error" message={errorMessage} />
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            <Input
              id="register-name"
              label="Nome completo"
              type="text"
              autoComplete="name"
              placeholder="Ex: Dra. Juliana Silveira"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              leftIcon={<User className="h-4 w-4 text-slate-400" />}
              required
            />

            <Input
              id="register-email"
              label="Email profissional"
              type="email"
              autoComplete="email"
              placeholder="seu.email@nutricao.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="h-4 w-4 text-slate-400" />}
              required
            />

            <div className="space-y-1">
              <Input
                id="register-password"
                label="Senha"
                isPassword
                autoComplete="new-password"
                placeholder="Mínimo 9 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="h-4 w-4 text-slate-400" />}
                required
              />
              <div className="flex items-center gap-1.5 pt-1 text-xs">
                <div
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    password.length === 0
                      ? "bg-slate-200"
                      : password.length < 9
                      ? "bg-amber-400"
                      : "bg-emerald-500"
                  }`}
                />
                <span
                  className={`font-medium ${
                    isPasswordLengthValid ? "text-emerald-700" : "text-slate-500"
                  }`}
                >
                  {password.length < 9
                    ? `${password.length}/9 caracteres`
                    : "Senha válida (9+ car.)"}
                </span>
              </div>
            </div>

            <Input
              id="register-confirm-password"
              label="Confirmar senha"
              isPassword
              autoComplete="new-password"
              placeholder="Repita sua senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              leftIcon={<Lock className="h-4 w-4 text-slate-400" />}
              required
              helperText={
                confirmPassword.length > 0 && doPasswordsMatch
                  ? "✓ As senhas coincidem"
                  : undefined
              }
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              isLoading={isSubmitting}
            >
              Criar conta
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-600">
              Já tem conta?{" "}
              <Link
                to="/login"
                className="font-semibold text-emerald-600 hover:text-emerald-700 hover:underline transition-colors"
              >
                Faça login
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>Seus dados sincronizados de forma segura no Neon Database</span>
        </div>
      </div>
    </div>
  );
};
