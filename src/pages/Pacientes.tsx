import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { fetchPacientesComUltimaConsulta, PacienteListItem } from "@/lib/db";
import { formatSafeDate } from "@/lib/utils";
import {
  Users,
  UserPlus,
  Search,
  Calendar,
  Target,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Sparkles,
  Phone,
  Mail,
} from "lucide-react";

export const Pacientes: React.FC = () => {
  const { user } = useAuth();
  const [pacientes, setPacientes] = useState<PacienteListItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPacientes = async (isManual = false) => {
    if (!user) return;
    if (isManual) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const data = await fetchPacientesComUltimaConsulta(user.id, user.email);
      setPacientes(data);
    } catch (err: any) {
      console.error("Erro ao carregar pacientes:", err);
      setError("Não foi possível carregar a lista de pacientes do banco de dados.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadPacientes();
  }, [user]);

  // Filtro de busca por nome (case insensitive)
  const filteredPacientes = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return pacientes;
    return pacientes.filter((p) => p.nome.toLowerCase().includes(term));
  }, [pacientes, searchTerm]);

  // Formata data para DD/MM/AAAA
  const formatDate = (dateVal: any) => {
    if (!dateVal) return "Nenhuma consulta registrada";
    return formatSafeDate(dateVal);
  };

  // Resume o objetivo do paciente
  const formatObjetivo = (paciente: PacienteListItem) => {
    if (paciente.objetivos && paciente.objetivos.length > 0) {
      return paciente.objetivos.join(", ");
    }
    if (paciente.objetivo_texto) {
      return paciente.objetivo_texto;
    }
    return "Objetivo não informado";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Cabeçalho da página */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200/80 mb-2">
              <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
              Gestão Clínica
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Pacientes
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Visualize, busque e gerencie os pacientes cadastrados no seu consultório
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => loadPacientes(true)}
              disabled={isLoading || isRefreshing}
              title="Recarregar pacientes"
              className="p-2.5 rounded-xl border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 transition-all shadow-sm active:scale-95 disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 text-emerald-600 ${isRefreshing ? "animate-spin" : ""}`}
              />
            </button>

            <Link
              to="/pacientes/novo"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 hover:shadow-emerald-600/30 transition-all active:scale-95 shrink-0"
            >
              <UserPlus className="h-4 w-4" />
              Novo Paciente
            </Link>
          </div>
        </div>

        {/* Mensagem de erro se houver */}
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => loadPacientes(true)}
              className="text-xs font-semibold underline ml-4 hover:no-underline"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* Campo de busca por nome */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar paciente pelo nome completo..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs font-semibold text-slate-400 hover:text-slate-600"
            >
              Limpar
            </button>
          )}
        </div>

        {/* Conteúdo: Listagem ou Estados vazios */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="py-16 text-center space-y-3">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-emerald-600 border-t-transparent" />
              <p className="text-sm text-slate-500">Carregando lista de pacientes...</p>
            </div>
          ) : pacientes.length === 0 ? (
            /* Estado quando não há nenhum paciente no banco */
            <div className="py-16 px-6 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 mb-3">
                <Users className="h-7 w-7" />
              </div>
              <h2 className="text-base font-bold text-slate-800">
                Nenhum paciente cadastrado ainda
              </h2>
              <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                Comece cadastrando seu primeiro paciente para registrar consultas e montar planos alimentares.
              </p>
              <div className="mt-6">
                <Link
                  to="/pacientes/novo"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition-all"
                >
                  <UserPlus className="h-4 w-4" />
                  Cadastrar Primeiro Paciente
                </Link>
              </div>
            </div>
          ) : filteredPacientes.length === 0 ? (
            /* Estado quando a busca não encontrou resultados */
            <div className="py-12 px-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
                <Search className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">
                Nenhum paciente encontrado para "{searchTerm}"
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Verifique a ortografia ou tente buscar por outro termo.
              </p>
              <button
                onClick={() => setSearchTerm("")}
                className="mt-4 text-xs font-semibold text-emerald-600 hover:underline"
              >
                Limpar filtro de busca
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              <div className="px-6 py-3 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <span>Paciente &amp; Objetivo</span>
                <span>Última Consulta</span>
              </div>

              {filteredPacientes.map((paciente) => (
                <Link
                  key={paciente.id}
                  to={`/pacientes/${paciente.id}`}
                  className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:px-6 hover:bg-emerald-50/40 transition-colors gap-3"
                >
                  {/* Nome e Objetivo */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="h-11 w-11 rounded-xl bg-gradient-to-tr from-emerald-100 to-teal-50 text-emerald-800 font-bold flex items-center justify-center border border-emerald-200 group-hover:scale-105 group-hover:from-emerald-200 group-hover:to-teal-100 transition-all shrink-0 shadow-sm">
                      {paciente.nome.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors truncate">
                        {paciente.nome}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 flex-wrap">
                        <span className="inline-flex items-center gap-1 font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                          <Target className="h-3 w-3 text-emerald-600 shrink-0" />
                          <span className="truncate max-w-[260px]">
                            {formatObjetivo(paciente)}
                          </span>
                        </span>

                        {paciente.whatsapp && (
                          <span className="hidden md:inline-flex items-center gap-1 text-slate-400">
                            <Phone className="h-3 w-3" />
                            {paciente.whatsapp}
                          </span>
                        )}

                        {paciente.email && (
                          <span className="hidden lg:inline-flex items-center gap-1 text-slate-400 truncate max-w-[180px]">
                            <Mail className="h-3 w-3" />
                            {paciente.email}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Data da última consulta + seta */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                    <div className="text-left sm:text-right">
                      <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                        <Calendar className="h-3.5 w-3.5 text-slate-500" />
                        <span>{formatDate(paciente.ultima_consulta)}</span>
                      </div>
                    </div>

                    <div className="h-8 w-8 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all shrink-0">
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Rodapé informativo */}
        {!isLoading && pacientes.length > 0 && (
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>
              Exibindo <strong>{filteredPacientes.length}</strong> de{" "}
              <strong>{pacientes.length}</strong> pacientes cadastrados
            </span>
            <span>Clique no paciente para ver prontuário e detalhes</span>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
