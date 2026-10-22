import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  fetchDashboardMetrics,
  DashboardMetrics,
  PacienteSemRetorno,
} from "@/lib/db";
import {
  Users,
  CalendarDays,
  UserX,
  ArrowRight,
  RefreshCw,
  Clock,
  Sparkles,
  Phone,
  Mail,
  Calendar,
  AlertCircle,
  TrendingUp,
  Activity,
} from "lucide-react";

export const Dashboard: React.FC = () => {
  const { user } = useAuth();

  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalPacientes: 0,
    consultasSemana: 0,
    pacientesSemRetorno: [],
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (isManualRefresh = false) => {
    if (!user) return;
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const data = await fetchDashboardMetrics(user.id, user.email);
      setMetrics(data);
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error("Erro ao carregar dados do Neon:", err);
      setError("Não foi possível carregar os dados em tempo real do banco Neon.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();

    // Auto-refresh periodically (every 60s) to keep real-time sync with Neon
    const interval = setInterval(() => {
      loadData(true);
    }, 60000);

    return () => clearInterval(interval);
  }, [loadData]);

  // Formatter for consultation date (DD/MM/YYYY)
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    // Avoid timezone shift by splitting date parts
    const parts = dateStr.split("T")[0].split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return new Date(dateStr).toLocaleDateString("pt-BR");
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Top Header / Greeting */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200/80 mb-2">
              <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
              Painel Clínico • Neon DB
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Olá, {user?.name || "Nutricionista"}
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Acompanhe seus pacientes e consultas em tempo real
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <span className="text-xs text-slate-400 hidden sm:inline-block">
              Atualizado às {lastUpdated.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </span>
            <button
              onClick={() => loadData(true)}
              disabled={isLoading || isRefreshing}
              title="Atualizar dados do Neon"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm active:scale-95 disabled:opacity-60"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 text-emerald-600 ${isRefreshing ? "animate-spin" : ""}`}
              />
              {isRefreshing ? "Sincronizando..." : "Atualizar"}
            </button>
          </div>
        </div>

        {/* Error Notification if any */}
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => loadData(true)}
              className="text-xs font-semibold underline hover:no-underline ml-4"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* 3 Main Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 — Total de pacientes ativos */}
          <div className="relative overflow-hidden bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Total de Pacientes Ativos
                </p>
                <div className="flex items-baseline gap-2 pt-2">
                  <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                    {isLoading ? (
                      <span className="inline-block w-12 h-9 bg-slate-200 rounded animate-pulse" />
                    ) : (
                      metrics.totalPacientes
                    )}
                  </span>
                  <span className="text-xs font-medium text-slate-400">pacientes</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-500/20">
                <Users className="h-6 w-6" />
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                <TrendingUp className="h-3.5 w-3.5" /> Cadastrados por você
              </span>
              <Link
                to="/pacientes"
                className="text-slate-500 hover:text-emerald-700 font-semibold inline-flex items-center gap-1 group"
              >
                Ver todos
                <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Card 2 — Consultas da semana */}
          <div className="relative overflow-hidden bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Consultas da Semana
                </p>
                <div className="flex items-baseline gap-2 pt-2">
                  <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                    {isLoading ? (
                      <span className="inline-block w-12 h-9 bg-slate-200 rounded animate-pulse" />
                    ) : (
                      metrics.consultasSemana
                    )}
                  </span>
                  <span className="text-xs font-medium text-slate-400">agendadas/feitas</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-gradient-to-tr from-teal-600 to-cyan-500 text-white shadow-md shadow-teal-500/20">
                <CalendarDays className="h-6 w-6" />
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-1.5 text-teal-700 font-semibold bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">
                <Activity className="h-3.5 w-3.5" /> Semana corrente
              </span>
              <span className="text-slate-400">Segunda a Domingo</span>
            </div>
          </div>

          {/* Card 3 Summary Header Indicator */}
          <div className="relative overflow-hidden bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Pacientes sem Retorno
                </p>
                <div className="flex items-baseline gap-2 pt-2">
                  <span className="text-3xl sm:text-4xl font-extrabold text-amber-600 tracking-tight">
                    {isLoading ? (
                      <span className="inline-block w-12 h-9 bg-slate-200 rounded animate-pulse" />
                    ) : (
                      metrics.pacientesSemRetorno.length
                    )}
                  </span>
                  <span className="text-xs font-medium text-slate-400">precisam de contato</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-400 text-white shadow-md shadow-amber-500/20">
                <UserX className="h-6 w-6" />
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-1.5 text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                <Clock className="h-3.5 w-3.5" /> &gt; 30 dias sem consulta
              </span>
              <span className="text-slate-400">Sem retorno agendado</span>
            </div>
          </div>
        </div>

        {/* Card 3 Detailed List Section — Pacientes sem retorno */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  Lista de Pacientes sem Retorno
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  {metrics.pacientesSemRetorno.length}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Pacientes cuja última consulta foi realizada há mais de 30 dias e que ainda não têm retorno agendado
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              <span>Clique no paciente para acessar o perfil</span>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {isLoading ? (
              <div className="p-8 text-center space-y-3">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-emerald-600 border-t-transparent" />
                <p className="text-sm text-slate-500">Carregando dados do Neon PostgreSQL...</p>
              </div>
            ) : metrics.pacientesSemRetorno.length === 0 ? (
              /* Mensagem de estado vazio exigida pelo prompt */
              <div className="py-12 px-6 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 mb-3">
                  <Sparkles className="h-7 w-7" />
                </div>
                <h3 className="text-base font-bold text-slate-800">
                  Nenhum paciente sem retorno no momento
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Excelente! Todos os seus pacientes cadastrados estão em dia ou possuem consultas de retorno agendadas.
                </p>
              </div>
            ) : (
              metrics.pacientesSemRetorno.map((paciente: PacienteSemRetorno) => (
                <Link
                  key={paciente.paciente_id}
                  to={`/pacientes/${paciente.paciente_id}`}
                  className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:px-6 hover:bg-slate-50/80 transition-colors gap-3"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-900 font-bold flex items-center justify-center border border-amber-200 group-hover:scale-105 group-hover:bg-amber-200 transition-all shrink-0">
                      {paciente.paciente_nome.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors truncate">
                        {paciente.paciente_nome}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5 flex-wrap">
                        {paciente.paciente_telefone && (
                          <span className="inline-flex items-center gap-1">
                            <Phone className="h-3 w-3 text-slate-400" />
                            {paciente.paciente_telefone}
                          </span>
                        )}
                        {paciente.paciente_email && (
                          <span className="inline-flex items-center gap-1 truncate max-w-[200px]">
                            <Mail className="h-3 w-3 text-slate-400" />
                            {paciente.paciente_email}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                    <div className="text-left sm:text-right">
                      <div className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        <Calendar className="h-3 w-3" />
                        Última: {formatDate(paciente.ultima_consulta)}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        há <strong className="text-amber-800">{paciente.dias_desde_ultima_consulta} dias</strong> sem consulta
                      </p>
                    </div>

                    <div className="h-8 w-8 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all shrink-0">
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
