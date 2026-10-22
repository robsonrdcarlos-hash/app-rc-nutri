import React, { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  fetchPacientePorId,
  updatePaciente,
  fetchConsultasPorPaciente,
  createConsulta,
  fetchPlanosPorPaciente,
  Paciente,
  Consulta,
  PlanoAlimentar,
  CreateConsultaInput,
} from "@/lib/db";
import { formatSafeDate, toInputDateFormat } from "@/lib/utils";
import {
  ArrowLeft,
  Calendar,
  Phone,
  Mail,
  Activity,
  AlertTriangle,
  Sparkles,
  Save,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  User,
  Plus,
  X,
  FileText,
  Clock,
  Weight,
  CalendarPlus,
} from "lucide-react";

// Opções predefinidas
const OBJETIVOS_PREDEFINIDOS = [
  "Emagrecer",
  "Ganhar massa",
  "Controlar diabetes",
  "Saúde geral",
  "Performance esportiva",
  "Reeducação alimentar",
];

const NIVEIS_ATIVIDADE = [
  "Sedentário",
  "Levemente ativo",
  "Moderadamente ativo",
  "Muito ativo",
  "Extremamente ativo",
];

const PATOLOGIAS_PREDEFINIDAS = [
  "Diabetes",
  "Hipertensão",
  "Hipotireoidismo",
  "Hipertireoidismo",
  "Síndrome do ovário policístico",
  "Doença celíaca",
  "Colesterol alto",
];

const RESTRICOES_PREDEFINIDAS = [
  "Lactose",
  "Glúten",
  "Açúcar",
  "Carne vermelha",
  "Frutos do mar",
];

const ALERGIAS_PREDEFINIDAS = [
  "Amendoim",
  "Leite",
  "Ovo",
  "Soja",
  "Trigo",
  "Frutos do mar",
];

export const PacientePerfil: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  // Estados principais
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [planos, setPlanos] = useState<PlanoAlimentar[]>([]);
  const [planoSelecionado, setPlanoSelecionado] = useState<PlanoAlimentar | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Seção ativa de navegação interna: 'dados' | 'consultas' | 'planos'
  const [activeSection, setActiveSection] = useState<"dados" | "consultas" | "planos">("dados");

  // Aba dos dados do paciente: 'pessoal' | 'clinico' | 'habitos'
  const [activeTab, setActiveTab] = useState<"pessoal" | "clinico" | "habitos">("pessoal");

  // Formulário editável dos dados do paciente
  // Aba 1 - Pessoal
  const [nome, setNome] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [sexo, setSexo] = useState<"Feminino" | "Masculino" | "Outro" | "">("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");

  // Aba 2 - Clínico
  const [peso, setPeso] = useState("");
  const [altura, setAltura] = useState("");
  const [objetivos, setObjetivos] = useState<string[]>([]);
  const [objetivoTexto, setObjetivoTexto] = useState("");
  const [nivelAtividade, setNivelAtividade] = useState("");
  const [patologias, setPatologias] = useState<string[]>([]);
  const [novaPatologia, setNovaPatologia] = useState("");
  const [restricoes, setRestricoes] = useState<string[]>([]);
  const [novaRestricao, setNovaRestricao] = useState("");
  const [alergias, setAlergias] = useState<string[]>([]);
  const [novaAlergia, setNovaAlergia] = useState("");
  const [medicamentos, setMedicamentos] = useState("");
  const [suplementos, setSuplementos] = useState("");

  // Aba 3 - Hábitos
  const [refeicoesPorDia, setRefeicoesPorDia] = useState("");
  const [horarioAcorda, setHorarioAcorda] = useState("");
  const [horarioDorme, setHorarioDorme] = useState("");
  const [litrosAgua, setLitrosAgua] = useState("");
  const [praticaAtividade, setPraticaAtividade] = useState<boolean | null>(null);
  const [atividadeDescricao, setAtividadeDescricao] = useState("");
  const [observacoes, setObservacoes] = useState("");

  // Estados de salvamento de dados do paciente
  const [isSavingPaciente, setIsSavingPaciente] = useState(false);
  const [savePacienteSuccess, setSavePacienteSuccess] = useState<string | null>(null);
  const [savePacienteError, setSavePacienteError] = useState<string | null>(null);

  // Estados do Modal de Nova Consulta
  const [isModalConsultaOpen, setIsModalConsultaOpen] = useState(false);
  const [consultaData, setConsultaData] = useState(() => new Date().toISOString().split("T")[0]);
  const [consultaPeso, setConsultaPeso] = useState("");
  const [consultaCintura, setConsultaCintura] = useState("");
  const [consultaQuadril, setConsultaQuadril] = useState("");
  const [consultaGordura, setConsultaGordura] = useState("");
  const [consultaObs, setConsultaObs] = useState("");
  const [consultaRetorno, setConsultaRetorno] = useState("");
  const [isSavingConsulta, setIsSavingConsulta] = useState(false);
  const [modalConsultaError, setModalConsultaError] = useState<string | null>(null);

  // Carrega os dados do paciente, consultas e planos
  const loadData = async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);

    try {
      const [pacData, consultasData, planosData] = await Promise.all([
        fetchPacientePorId(id),
        fetchConsultasPorPaciente(id),
        fetchPlanosPorPaciente(id),
      ]);

      if (!pacData) {
        setError("Paciente não encontrado no sistema.");
        setIsLoading(false);
        return;
      }

      setPaciente(pacData);
      setConsultas(consultasData || []);
      setPlanos(planosData || []);

      // Preenche os estados dos campos editáveis com os dados carregados
      setNome(pacData.nome || "");
      setDataNascimento(toInputDateFormat(pacData.data_nascimento));
      setSexo((pacData.sexo as any) || "");
      setWhatsapp(pacData.whatsapp || "");
      setEmail(pacData.email || "");

      setPeso(pacData.peso_inicial != null ? String(pacData.peso_inicial) : "");
      setAltura(pacData.altura != null ? String(pacData.altura) : "");
      setObjetivos(Array.isArray(pacData.objetivos) ? pacData.objetivos : []);
      setObjetivoTexto(pacData.objetivo_texto || "");
      setNivelAtividade(pacData.nivel_atividade || "");
      setPatologias(Array.isArray(pacData.patologias) ? pacData.patologias : []);
      setRestricoes(Array.isArray(pacData.restricoes_alimentares) ? pacData.restricoes_alimentares : []);
      setAlergias(Array.isArray(pacData.alergias) ? pacData.alergias : []);
      setMedicamentos(pacData.medicamentos || "");
      setSuplementos(pacData.suplementos || "");

      setRefeicoesPorDia(pacData.refeicoes_por_dia != null ? String(pacData.refeicoes_por_dia) : "");
      setHorarioAcorda(pacData.horario_acorda || "");
      setHorarioDorme(pacData.horario_dorme || "");
      setLitrosAgua(pacData.litros_agua != null ? String(pacData.litros_agua) : "");
      setPraticaAtividade(pacData.atividade_fisica ?? null);
      setAtividadeDescricao(pacData.atividade_fisica_descricao || "");
      setObservacoes(pacData.observacoes || "");

      // Sugere o último peso para o formulário de consulta
      if (consultasData && consultasData.length > 0 && consultasData[0].peso) {
        setConsultaPeso(String(consultasData[0].peso));
      } else if (pacData.peso_inicial) {
        setConsultaPeso(String(pacData.peso_inicial));
      }
    } catch (err: any) {
      console.error("Erro ao carregar paciente:", err);
      setError("Erro ao consultar dados no Neon PostgreSQL.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  // Formata hora inteligente
  const formatTimeOnBlur = (val: string): string => {
    const trimmed = val.trim();
    if (!trimmed) return "";
    if (trimmed.includes(":")) {
      const [h, m] = trimmed.split(":");
      const cleanH = String(parseInt(h || "0", 10)).padStart(2, "0");
      const cleanM = String(parseInt(m || "0", 10)).padStart(2, "0");
      return `${cleanH}:${cleanM}`;
    }
    const digits = trimmed.replace(/\D/g, "");
    if (!digits) return "";
    if (digits.length <= 2) {
      const h = Math.min(parseInt(digits, 10), 23);
      return `${String(h).padStart(2, "0")}:00`;
    }
    if (digits.length === 3) {
      const h = Math.min(parseInt(digits.slice(0, 1), 10), 23);
      const m = Math.min(parseInt(digits.slice(1), 10), 59);
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    }
    const h = Math.min(parseInt(digits.slice(0, 2), 10), 23);
    const m = Math.min(parseInt(digits.slice(2, 4), 10), 59);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };

  // Máscara WhatsApp
  const handleWhatsappChange = (val: string) => {
    const raw = val.replace(/\D/g, "").slice(0, 11);
    let formatted = raw;
    if (raw.length > 2) formatted = `(${raw.slice(0, 2)}) ${raw.slice(2)}`;
    if (raw.length > 7) formatted = `(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7, 11)}`;
    setWhatsapp(formatted);
  };

  // Chips toggle
  const toggleArrayItem = (
    currentList: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    item: string
  ) => {
    if (item === "Nenhum") {
      setList(currentList.includes("Nenhum") ? [] : ["Nenhum"]);
      return;
    }
    const filtered = currentList.filter((x) => x !== "Nenhum");
    if (filtered.includes(item)) {
      setList(filtered.filter((x) => x !== item));
    } else {
      setList([...filtered, item]);
    }
  };

  const handleAddCustomItem = (
    value: string,
    setValue: (val: string) => void,
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const cleanList = list.filter((x) => x !== "Nenhum");
    if (!cleanList.includes(trimmed)) {
      setList([...cleanList, trimmed]);
    }
    setValue("");
  };

  // Cálculo IMC
  const imcInfo = useMemo(() => {
    const p = parseFloat(peso.replace(",", "."));
    const aCm = parseFloat(altura.replace(",", "."));
    if (p > 0 && aCm > 0) {
      const aM = aCm / 100;
      const imc = p / (aM * aM);
      const imcVal = imc.toFixed(1);

      let classificacao = "";
      let cor = "text-slate-700 bg-slate-100";
      if (imc < 18.5) {
        classificacao = "Abaixo do peso";
        cor = "text-amber-700 bg-amber-50 border-amber-200";
      } else if (imc < 25) {
        classificacao = "Peso normal";
        cor = "text-emerald-700 bg-emerald-50 border-emerald-200";
      } else if (imc < 30) {
        classificacao = "Sobrepeso";
        cor = "text-yellow-700 bg-yellow-50 border-yellow-200";
      } else {
        classificacao = "Obesidade";
        cor = "text-red-700 bg-red-50 border-red-200";
      }
      return { valor: imcVal, classificacao, cor };
    }
    return null;
  }, [peso, altura]);

  // Idade calculada
  const idadeCalculada = useMemo(() => {
    if (!dataNascimento) return null;
    const parts = dataNascimento.split("-");
    if (parts.length !== 3) return null;
    const birthYear = parseInt(parts[0], 10);
    const birthMonth = parseInt(parts[1], 10) - 1;
    const birthDay = parseInt(parts[2], 10);
    const today = new Date();
    let age = today.getFullYear() - birthYear;
    const monthDiff = today.getMonth() - birthMonth;
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDay)) age--;
    return age >= 0 ? age : null;
  }, [dataNascimento]);

  // Salvar alterações nos Dados do Paciente
  const handleSavePaciente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    if (!nome.trim()) {
      setSavePacienteError("O campo 'Nome completo' é obrigatório.");
      return;
    }

    setIsSavingPaciente(true);
    setSavePacienteError(null);
    setSavePacienteSuccess(null);

    try {
      const pesoNum = peso ? parseFloat(peso.replace(",", ".")) : null;
      const alturaNum = altura ? parseFloat(altura.replace(",", ".")) : null;
      const refeicoesNum = refeicoesPorDia ? parseInt(refeicoesPorDia, 10) : null;
      const litrosNum = litrosAgua ? parseFloat(litrosAgua.replace(",", ".")) : null;

      const updated = await updatePaciente(id, {
        nome: nome.trim(),
        data_nascimento: dataNascimento || null,
        sexo: sexo || null,
        whatsapp: whatsapp || null,
        email: email.trim() || null,
        peso_inicial: !isNaN(Number(pesoNum)) ? pesoNum : null,
        altura: !isNaN(Number(alturaNum)) ? alturaNum : null,
        objetivos: objetivos.length > 0 ? objetivos : null,
        objetivo_texto: objetivoTexto.trim() || null,
        nivel_atividade: nivelAtividade || null,
        patologias: patologias.length > 0 ? patologias : null,
        restricoes_alimentares: restricoes.length > 0 ? restricoes : null,
        alergias: alergias.length > 0 ? alergias : null,
        medicamentos: medicamentos.trim() || null,
        suplementos: suplementos.trim() || null,
        refeicoes_por_dia: !isNaN(Number(refeicoesNum)) ? refeicoesNum : null,
        horario_acorda: horarioAcorda || null,
        horario_dorme: horarioDorme || null,
        litros_agua: !isNaN(Number(litrosNum)) ? litrosNum : null,
        atividade_fisica: praticaAtividade,
        atividade_fisica_descricao: praticaAtividade ? atividadeDescricao.trim() || null : null,
        observacoes: observacoes.trim() || null,
      });

      setPaciente(updated);
      setSavePacienteSuccess("Dados do paciente atualizados com sucesso!");
      setTimeout(() => setSavePacienteSuccess(null), 4000);
    } catch (err: any) {
      console.error("Erro ao atualizar paciente:", err);
      setSavePacienteError("Não foi possível salvar as alterações no banco de dados.");
    } finally {
      setIsSavingPaciente(false);
    }
  };

  // Salvar Nova Consulta
  const handleSalvarConsulta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    const pesoNum = parseFloat(consultaPeso.replace(",", "."));
    if (isNaN(pesoNum) || pesoNum <= 0) {
      setModalConsultaError("Informe um peso válido para registrar a consulta.");
      return;
    }
    if (!consultaData) {
      setModalConsultaError("Selecione a data da consulta.");
      return;
    }

    setIsSavingConsulta(true);
    setModalConsultaError(null);

    try {
      const nova: CreateConsultaInput = {
        paciente_id: id,
        data_consulta: consultaData,
        peso: pesoNum,
        cintura: consultaCintura ? parseFloat(consultaCintura.replace(",", ".")) : null,
        quadril: consultaQuadril ? parseFloat(consultaQuadril.replace(",", ".")) : null,
        percentual_gordura: consultaGordura ? parseFloat(consultaGordura.replace(",", ".")) : null,
        observacoes: consultaObs.trim() || null,
        proximo_retorno: consultaRetorno || null,
      };

      const criada = await createConsulta(nova);

      // Atualiza lista de consultas e gráfico automaticamente
      setConsultas((prev) => [criada, ...prev]);

      // Fecha o modal e limpa os campos
      setIsModalConsultaOpen(false);
      setConsultaObs("");
      setConsultaRetorno("");
    } catch (err: any) {
      console.error("Erro ao registrar consulta:", err);
      setModalConsultaError("Erro ao registrar consulta no Neon. Tente novamente.");
    } finally {
      setIsSavingConsulta(false);
    }
  };

  // Dados do gráfico de evolução de peso ordenados cronologicamente (do mais antigo para o mais recente)
  const pesoChartData = useMemo(() => {
    const list = [...consultas]
      .filter((c) => c.peso != null && c.peso > 0)
      .sort((a, b) => new Date(a.data_consulta).getTime() - new Date(b.data_consulta).getTime());

    return list.map((c) => ({
      data: formatSafeDate(c.data_consulta),
      peso: Number(c.peso),
    }));
  }, [consultas]);

  // Evolução de peso geral
  const pesoDiff = useMemo(() => {
    if (pesoChartData.length < 2) return null;
    const inicial = pesoChartData[0].peso;
    const atual = pesoChartData[pesoChartData.length - 1].peso;
    const diff = (atual - inicial).toFixed(1);
    return {
      diff: Number(diff),
      isDown: Number(diff) < 0,
      isEqual: Number(diff) === 0,
    };
  }, [pesoChartData]);

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Topo / Voltar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <Link
              to="/pacientes"
              className="p-2 rounded-xl border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 transition-colors shadow-sm"
              title="Voltar para a listagem"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200/80 mb-1">
                <Sparkles className="h-3 w-3 text-emerald-600" />
                Perfil do Paciente • Neon DB
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {isLoading ? "Carregando prontuário..." : paciente?.nome || "Prontuário"}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setConsultaData(new Date().toISOString().split("T")[0]);
                setIsModalConsultaOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <CalendarPlus className="h-4 w-4" />
              Nova Consulta
            </button>
          </div>
        </div>

        {/* Estado de Carregamento ou Erro */}
        {isLoading ? (
          <div className="bg-white rounded-2xl p-16 border border-slate-200 text-center space-y-3">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-emerald-600 border-t-transparent" />
            <p className="text-sm text-slate-500">Buscando dados em tempo real no Neon PostgreSQL...</p>
          </div>
        ) : error || !paciente ? (
          <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 border border-red-100">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">{error || "Paciente não encontrado"}</h3>
            <Link
              to="/pacientes"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-all"
            >
              Voltar para a lista de pacientes
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header com resumo do paciente */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-extrabold flex items-center justify-center text-2xl shadow-md shadow-emerald-500/20 shrink-0">
                  {paciente.nome ? paciente.nome.charAt(0).toUpperCase() : "P"}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{paciente.nome}</h2>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                    {paciente.sexo && (
                      <span className="font-semibold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-md">
                        {paciente.sexo}
                      </span>
                    )}
                    {paciente.data_nascimento && (
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        {formatSafeDate(paciente.data_nascimento)}
                        {idadeCalculada !== null && ` (${idadeCalculada} anos)`}
                      </span>
                    )}
                    {paciente.whatsapp && (
                      <span className="inline-flex items-center gap-1 font-mono text-emerald-700">
                        <Phone className="h-3.5 w-3.5" />
                        {paciente.whatsapp}
                      </span>
                    )}
                    {paciente.email && (
                      <span className="inline-flex items-center gap-1 text-slate-600">
                        <Mail className="h-3.5 w-3.5" />
                        {paciente.email}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Badges de métricas rápidas */}
              <div className="flex items-center gap-3 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
                <div className="text-center px-4 py-2 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Consultas</span>
                  <span className="text-base font-extrabold text-slate-800">{consultas.length}</span>
                </div>
                <div className="text-center px-4 py-2 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Peso Atual</span>
                  <span className="text-base font-extrabold text-slate-800">
                    {consultas.length > 0 && consultas[0].peso
                      ? `${consultas[0].peso} kg`
                      : paciente.peso_inicial
                      ? `${paciente.peso_inicial} kg`
                      : "-"}
                  </span>
                </div>
                <div className="text-center px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-100">
                  <span className="text-[10px] uppercase font-bold text-emerald-600 block">IMC</span>
                  <span className="text-base font-extrabold text-emerald-800">
                    {imcInfo ? imcInfo.valor : "-"}
                  </span>
                </div>
              </div>
            </div>

            {/* Navegação entre as 3 Seções Obrigatórias do Prompt 5 */}
            <div className="flex border-b border-slate-200 gap-2 bg-slate-100/70 p-1.5 rounded-2xl">
              <button
                type="button"
                onClick={() => setActiveSection("dados")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                  activeSection === "dados"
                    ? "bg-white text-emerald-700 shadow-sm border border-slate-200/80"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <User className="h-4 w-4" />
                1. Dados do Paciente
              </button>

              <button
                type="button"
                onClick={() => setActiveSection("consultas")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                  activeSection === "consultas"
                    ? "bg-white text-emerald-700 shadow-sm border border-slate-200/80"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Activity className="h-4 w-4" />
                2. Consultas ({consultas.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveSection("planos")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                  activeSection === "planos"
                    ? "bg-white text-emerald-700 shadow-sm border border-slate-200/80"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <FileText className="h-4 w-4" />
                3. Planos Alimentares ({planos.length})
              </button>
            </div>

            {/* ============================================================ */}
            {/* SEÇÃO 1 — DADOS DO PACIENTE (EDITÁVEL EM 3 ABAS) */}
            {/* ============================================================ */}
            {activeSection === "dados" && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 sm:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Dados do Paciente</h3>
                    <p className="text-xs text-slate-500">
                      Os campos podem ser editados diretamente abaixo. Clique em "Salvar alterações" para confirmar.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleSavePaciente}
                    disabled={isSavingPaciente}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition-all disabled:opacity-60 cursor-pointer self-start sm:self-auto"
                  >
                    {isSavingPaciente ? (
                      <>
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Salvar alterações
                      </>
                    )}
                  </button>
                </div>

                {savePacienteSuccess && (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                    <span>{savePacienteSuccess}</span>
                  </div>
                )}

                {savePacienteError && (
                  <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-center gap-2 text-sm">
                    <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
                    <span>{savePacienteError}</span>
                  </div>
                )}

                {/* Sub-abas: Pessoal, Clínico, Hábitos */}
                <div className="flex border-b border-slate-200 gap-2 bg-slate-50 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setActiveTab("pessoal")}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                      activeTab === "pessoal" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-600"
                    }`}
                  >
                    Aba 1: Pessoal
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("clinico")}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                      activeTab === "clinico" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-600"
                    }`}
                  >
                    Aba 2: Clínico
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("habitos")}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                      activeTab === "habitos" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-600"
                    }`}
                  >
                    Aba 3: Hábitos
                  </button>
                </div>

                <form onSubmit={handleSavePaciente} className="space-y-6 pt-2">
                  {/* ABA 1 — PESSOAL */}
                  {activeTab === "pessoal" && (
                    <div className="space-y-5">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                          Nome Completo *
                        </label>
                        <input
                          type="text"
                          required
                          value={nome}
                          onChange={(e) => setNome(e.target.value)}
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                            Data de Nascimento
                          </label>
                          <input
                            type="date"
                            value={dataNascimento}
                            onChange={(e) => setDataNascimento(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                          />
                          {idadeCalculada !== null && (
                            <p className="text-xs text-emerald-700 font-semibold mt-1">
                              Idade: {idadeCalculada} anos
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                            Sexo
                          </label>
                          <div className="grid grid-cols-3 gap-2">
                            {(["Feminino", "Masculino", "Outro"] as const).map((s) => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => setSexo(sexo === s ? "" : s)}
                                className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all cursor-pointer text-center ${
                                  sexo === s
                                    ? "bg-emerald-600 text-white border-emerald-600"
                                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                                }`}
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                            WhatsApp
                          </label>
                          <input
                            type="text"
                            value={whatsapp}
                            onChange={(e) => handleWhatsappChange(e.target.value)}
                            maxLength={15}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                            Email
                          </label>
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ABA 2 — CLÍNICO */}
                  {activeTab === "clinico" && (
                    <div className="space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                            Peso (kg)
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              step="0.1"
                              value={peso}
                              onChange={(e) => setPeso(e.target.value)}
                              className="w-full pl-4 pr-12 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                            />
                            <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs font-bold text-slate-400">
                              kg
                            </span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                            Altura (cm)
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              step="0.5"
                              value={altura}
                              onChange={(e) => setAltura(e.target.value)}
                              className="w-full pl-4 pr-12 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                            />
                            <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs font-bold text-slate-400">
                              cm
                            </span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                            IMC (somente leitura)
                          </label>
                          <div className="h-[42px] px-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-sm">
                            {imcInfo ? (
                              <>
                                <span className="font-extrabold text-slate-900">{imcInfo.valor}</span>
                                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${imcInfo.cor}`}>
                                  {imcInfo.classificacao}
                                </span>
                              </>
                            ) : (
                              <span className="text-xs text-slate-400">Preencha peso e altura</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Objetivos */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                          Objetivo (múltipla escolha)
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {OBJETIVOS_PREDEFINIDOS.map((obj) => (
                            <button
                              key={obj}
                              type="button"
                              onClick={() => toggleArrayItem(objetivos, setObjetivos, obj)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                                objetivos.includes(obj)
                                  ? "bg-emerald-600 text-white border-emerald-600"
                                  : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                              }`}
                            >
                              {obj}
                            </button>
                          ))}
                        </div>
                        <input
                          type="text"
                          value={objetivoTexto}
                          onChange={(e) => setObjetivoTexto(e.target.value)}
                          placeholder="Complemento livre sobre o objetivo..."
                          className="w-full mt-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                      </div>

                      {/* Nível de Atividade */}
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                          Nível de Atividade Física
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                          {NIVEIS_ATIVIDADE.map((n) => (
                            <button
                              key={n}
                              type="button"
                              onClick={() => setNivelAtividade(nivelAtividade === n ? "" : n)}
                              className={`p-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer text-center ${
                                nivelAtividade === n
                                  ? "bg-emerald-600 text-white border-emerald-600"
                                  : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                              }`}
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Patologias */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                          Patologias ou Condições de Saúde
                        </label>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => toggleArrayItem(patologias, setPatologias, "Nenhum")}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                              patologias.includes("Nenhum")
                                ? "bg-slate-800 text-white border-slate-800"
                                : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                            }`}
                          >
                            Nenhum
                          </button>
                          {PATOLOGIAS_PREDEFINIDAS.map((p) => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => toggleArrayItem(patologias, setPatologias, p)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                                patologias.includes(p)
                                  ? "bg-emerald-600 text-white border-emerald-600"
                                  : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                              }`}
                            >
                              {p}
                            </button>
                          ))}
                          {patologias
                            .filter((p) => p !== "Nenhum" && !PATOLOGIAS_PREDEFINIDAS.includes(p))
                            .map((c) => (
                              <span
                                key={c}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300"
                              >
                                {c}
                                <button
                                  type="button"
                                  onClick={() => setPatologias(patologias.filter((x) => x !== c))}
                                  className="hover:text-red-600"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </span>
                            ))}
                        </div>
                        <div className="flex gap-2 pt-1">
                          <input
                            type="text"
                            value={novaPatologia}
                            onChange={(e) => setNovaPatologia(e.target.value)}
                            placeholder="Adicionar outra patologia..."
                            className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddCustomItem(novaPatologia, setNovaPatologia, patologias, setPatologias)}
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 inline-flex items-center gap-1"
                          >
                            <Plus className="h-3.5 w-3.5" /> Adicionar
                          </button>
                        </div>
                      </div>

                      {/* Restrições Alimentares */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                          Restrições Alimentares
                        </label>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => toggleArrayItem(restricoes, setRestricoes, "Nenhum")}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                              restricoes.includes("Nenhum")
                                ? "bg-slate-800 text-white border-slate-800"
                                : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                            }`}
                          >
                            Nenhum
                          </button>
                          {RESTRICOES_PREDEFINIDAS.map((r) => (
                            <button
                              key={r}
                              type="button"
                              onClick={() => toggleArrayItem(restricoes, setRestricoes, r)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                                restricoes.includes(r)
                                  ? "bg-emerald-600 text-white border-emerald-600"
                                  : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                              }`}
                            >
                              {r}
                            </button>
                          ))}
                          {restricoes
                            .filter((r) => r !== "Nenhum" && !RESTRICOES_PREDEFINIDAS.includes(r))
                            .map((c) => (
                              <span
                                key={c}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300"
                              >
                                {c}
                                <button
                                  type="button"
                                  onClick={() => setRestricoes(restricoes.filter((x) => x !== c))}
                                  className="hover:text-red-600"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </span>
                            ))}
                        </div>
                        <div className="flex gap-2 pt-1">
                          <input
                            type="text"
                            value={novaRestricao}
                            onChange={(e) => setNovaRestricao(e.target.value)}
                            placeholder="Adicionar outra restrição..."
                            className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddCustomItem(novaRestricao, setNovaRestricao, restricoes, setRestricoes)}
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 inline-flex items-center gap-1"
                          >
                            <Plus className="h-3.5 w-3.5" /> Adicionar
                          </button>
                        </div>
                      </div>

                      {/* Alergias Alimentares */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                          Alergias Alimentares
                        </label>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => toggleArrayItem(alergias, setAlergias, "Nenhum")}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                              alergias.includes("Nenhum")
                                ? "bg-slate-800 text-white border-slate-800"
                                : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                            }`}
                          >
                            Nenhum
                          </button>
                          {ALERGIAS_PREDEFINIDAS.map((a) => (
                            <button
                              key={a}
                              type="button"
                              onClick={() => toggleArrayItem(alergias, setAlergias, a)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                                alergias.includes(a)
                                  ? "bg-emerald-600 text-white border-emerald-600"
                                  : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                              }`}
                            >
                              {a}
                            </button>
                          ))}
                          {alergias
                            .filter((a) => a !== "Nenhum" && !ALERGIAS_PREDEFINIDAS.includes(a))
                            .map((c) => (
                              <span
                                key={c}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300"
                              >
                                {c}
                                <button
                                  type="button"
                                  onClick={() => setAlergias(alergias.filter((x) => x !== c))}
                                  className="hover:text-red-600"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </span>
                            ))}
                        </div>
                        <div className="flex gap-2 pt-1">
                          <input
                            type="text"
                            value={novaAlergia}
                            onChange={(e) => setNovaAlergia(e.target.value)}
                            placeholder="Adicionar outra alergia..."
                            className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddCustomItem(novaAlergia, setNovaAlergia, alergias, setAlergias)}
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 inline-flex items-center gap-1"
                          >
                            <Plus className="h-3.5 w-3.5" /> Adicionar
                          </button>
                        </div>
                      </div>

                      {/* Medicamentos e Suplementos */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                            Medicamentos Contínuos
                          </label>
                          <textarea
                            rows={2}
                            value={medicamentos}
                            onChange={(e) => setMedicamentos(e.target.value)}
                            className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                            Suplementos em uso
                          </label>
                          <textarea
                            rows={2}
                            value={suplementos}
                            onChange={(e) => setSuplementos(e.target.value)}
                            className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ABA 3 — HÁBITOS */}
                  {activeTab === "habitos" && (
                    <div className="space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                            Refeições por dia
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="12"
                            value={refeicoesPorDia}
                            onChange={(e) => setRefeicoesPorDia(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                            Água por dia (litros)
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              step="0.1"
                              value={litrosAgua}
                              onChange={(e) => setLitrosAgua(e.target.value)}
                              className="w-full pl-4 pr-16 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                            />
                            <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs font-bold text-slate-400">
                              litros
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                            Horário que acorda
                          </label>
                          <input
                            type="text"
                            value={horarioAcorda}
                            onChange={(e) => setHorarioAcorda(e.target.value)}
                            onBlur={(e) => setHorarioAcorda(formatTimeOnBlur(e.target.value))}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                            Horário que dorme
                          </label>
                          <input
                            type="text"
                            value={horarioDorme}
                            onChange={(e) => setHorarioDorme(e.target.value)}
                            onBlur={(e) => setHorarioDorme(formatTimeOnBlur(e.target.value))}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
                          />
                        </div>
                      </div>

                      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                          Pratica atividade física?
                        </label>
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => setPraticaAtividade(true)}
                            className={`px-5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                              praticaAtividade === true
                                ? "bg-emerald-600 text-white border-emerald-600"
                                : "bg-white border-slate-200 text-slate-700"
                            }`}
                          >
                            Sim
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setPraticaAtividade(false);
                              setAtividadeDescricao("");
                            }}
                            className={`px-5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                              praticaAtividade === false
                                ? "bg-slate-700 text-white border-slate-700"
                                : "bg-white border-slate-200 text-slate-700"
                            }`}
                          >
                            Não
                          </button>
                        </div>

                        {praticaAtividade && (
                          <div className="pt-2">
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              Qual atividade e frequência?
                            </label>
                            <input
                              type="text"
                              value={atividadeDescricao}
                              onChange={(e) => setAtividadeDescricao(e.target.value)}
                              className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                            />
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                          Observações Gerais
                        </label>
                        <textarea
                          rows={3}
                          value={observacoes}
                          onChange={(e) => setObservacoes(e.target.value)}
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                        />
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t border-slate-100 flex justify-end">
                    <button
                      type="submit"
                      disabled={isSavingPaciente}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition-all disabled:opacity-60 cursor-pointer"
                    >
                      {isSavingPaciente ? "Salvando..." : "Salvar alterações"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ============================================================ */}
            {/* SEÇÃO 2 — CONSULTAS + GRÁFICO DE EVOLUÇÃO DE PESO */}
            {/* ============================================================ */}
            {activeSection === "consultas" && (
              <div className="space-y-6">
                {/* GRÁFICO DE EVOLUÇÃO DE PESO */}
                <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
                        <Weight className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900">Evolução do Peso</h3>
                        <p className="text-xs text-slate-500">Histórico de pesagem ao longo das consultas realizadas</p>
                      </div>
                    </div>

                    {pesoDiff && (
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold">
                        {pesoDiff.isDown ? (
                          <span className="text-emerald-700 flex items-center gap-1 font-bold">
                            <TrendingDown className="h-4 w-4" />
                            {pesoDiff.diff} kg desde o início
                          </span>
                        ) : pesoDiff.isEqual ? (
                          <span className="text-slate-600 font-bold">Peso mantido</span>
                        ) : (
                          <span className="text-amber-700 flex items-center gap-1 font-bold">
                            <TrendingUp className="h-4 w-4" />
                            +{pesoDiff.diff} kg desde o início
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {pesoChartData.length === 0 ? (
                    <div className="py-12 text-center bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
                      <Weight className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-slate-700">Nenhuma consulta registrada ainda</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Clique em "Nova Consulta" para registrar a primeira pesagem deste paciente.
                      </p>
                    </div>
                  ) : (
                    <div className="pt-2">
                      {/* Gráfico SVG Responsivo e Dinâmico */}
                      <div className="p-4 bg-gradient-to-b from-emerald-50/20 to-white rounded-xl border border-slate-100">
                        <div className="h-56 w-full flex items-end gap-3 sm:gap-6 pt-6 pb-2 px-2 overflow-x-auto">
                          {(() => {
                            const pesos = pesoChartData.map((d) => d.peso);
                            const min = Math.min(...pesos) - 2;
                            const max = Math.max(...pesos) + 2;
                            const range = max - min || 1;

                            return pesoChartData.map((item, index) => {
                              const heightPct = Math.max(15, Math.min(100, ((item.peso - min) / range) * 100));
                              return (
                                <div
                                  key={index}
                                  className="flex-1 min-w-[50px] flex flex-col items-center gap-2 group h-full justify-end"
                                >
                                  <span className="text-xs font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md shadow-xs group-hover:scale-110 transition-transform">
                                    {item.peso} kg
                                  </span>

                                  <div className="w-full max-w-[42px] bg-slate-100 rounded-t-xl overflow-hidden flex items-end h-full">
                                    <div
                                      style={{ height: `${heightPct}%` }}
                                      className="w-full bg-gradient-to-t from-emerald-600 to-teal-400 rounded-t-xl transition-all duration-500 shadow-sm group-hover:from-emerald-500 group-hover:to-teal-300"
                                    />
                                  </div>

                                  <span className="text-[10px] font-semibold text-slate-500 truncate max-w-[65px] text-center">
                                    {item.data}
                                  </span>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* LISTA DE CONSULTAS */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Histórico de Consultas</h3>
                      <p className="text-xs text-slate-500">Ordenadas da mais recente para a mais antiga</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setConsultaData(new Date().toISOString().split("T")[0]);
                        setIsModalConsultaOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors cursor-pointer border border-emerald-100"
                    >
                      <Plus className="h-3.5 w-3.5" /> Adicionar Consulta
                    </button>
                  </div>

                  {consultas.length === 0 ? (
                    <div className="py-12 text-center px-4">
                      <Calendar className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-slate-700">Nenhuma consulta registrada ainda</p>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                        Registre a consulta inicial ou de retorno para acompanhar as medidas e planejar a dieta.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {consultas.map((c, i) => (
                        <div key={c.id || i} className="p-5 sm:px-6 hover:bg-slate-50/70 transition-colors space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-200">
                                {formatSafeDate(c.data_consulta)}
                              </span>
                              <span className="text-sm font-bold text-slate-900">
                                Peso: <strong className="text-emerald-700">{c.peso ? `${c.peso} kg` : "-"}</strong>
                              </span>
                            </div>

                            {c.proximo_retorno && (
                              <div className="inline-flex items-center gap-1.5 text-xs text-amber-800 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                                <Clock className="h-3 w-3 text-amber-600" />
                                Próximo Retorno: <strong>{formatSafeDate(c.proximo_retorno)}</strong>
                              </div>
                            )}
                          </div>

                          {/* Medidas antropométricas opcionais */}
                          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                            {c.cintura != null && (
                              <span className="bg-slate-100 px-2 py-0.5 rounded-md">
                                Cintura: <strong>{c.cintura} cm</strong>
                              </span>
                            )}
                            {c.quadril != null && (
                              <span className="bg-slate-100 px-2 py-0.5 rounded-md">
                                Quadril: <strong>{c.quadril} cm</strong>
                              </span>
                            )}
                            {c.percentual_gordura != null && (
                              <span className="bg-slate-100 px-2 py-0.5 rounded-md">
                                % Gordura: <strong>{c.percentual_gordura}%</strong>
                              </span>
                            )}
                          </div>

                          {c.observacoes && (
                            <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                              <span className="font-bold text-slate-500">Observações: </span>
                              {c.observacoes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* SEÇÃO 3 — PLANOS ALIMENTARES */}
            {/* ============================================================ */}
            {activeSection === "planos" && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Planos Alimentares</h3>
                    <p className="text-xs text-slate-500">
                      Crie planos personalizados com IA ou consulte os históricos gerados para o paciente
                    </p>
                  </div>

                  {/* Botão Gerar Plano Alimentar visível conforme requisito do Prompt 5 */}
                  <button
                    type="button"
                    onClick={() => alert("A geração com IA será ativada no próximo prompt!")}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition-all cursor-pointer self-start sm:self-auto"
                  >
                    <Sparkles className="h-4 w-4" />
                    Gerar Plano Alimentar
                  </button>
                </div>

                {/* Histórico de planos salvos em ordem cronológica decrescente */}
                {planos.length === 0 ? (
                  <div className="py-16 text-center">
                    <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <h4 className="text-base font-bold text-slate-800">
                      Nenhum plano alimentar gerado ainda
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Assim que você gerar o primeiro plano com base nas preferências e histórico do paciente, ele aparecerá listado aqui.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {planos.map((plano) => (
                        <div
                          key={plano.id}
                          onClick={() => setPlanoSelecionado(plano)}
                          className={`p-4 rounded-xl border transition-all cursor-pointer ${
                            planoSelecionado?.id === plano.id
                              ? "border-emerald-500 bg-emerald-50/50 shadow-sm"
                              : "border-slate-200 hover:border-emerald-300 hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-emerald-700">Plano Salvo</span>
                            <span className="text-[11px] text-slate-400">
                              {formatSafeDate(plano.created_at)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 line-clamp-2">
                            {typeof plano.conteudo === "string"
                              ? plano.conteudo
                              : JSON.stringify(plano.conteudo)}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Exibição completa do plano selecionado */}
                    {planoSelecionado && (
                      <div className="mt-6 p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                          <h4 className="text-sm font-bold text-slate-800">
                            Conteúdo do Plano • {formatSafeDate(planoSelecionado.created_at)}
                          </h4>
                          <button
                            type="button"
                            onClick={() => setPlanoSelecionado(null)}
                            className="text-xs text-slate-400 hover:text-slate-600"
                          >
                            Fechar
                          </button>
                        </div>
                        <pre className="text-xs text-slate-700 whitespace-pre-wrap font-sans bg-white p-4 rounded-xl border border-slate-200 overflow-x-auto max-h-96">
                          {typeof planoSelecionado.conteudo === "string"
                            ? planoSelecionado.conteudo
                            : JSON.stringify(planoSelecionado.conteudo, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* MODAL NOVA CONSULTA */}
        {/* ============================================================ */}
        {isModalConsultaOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
            <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Registrar Nova Consulta</h3>
                  <p className="text-xs text-slate-500">Adicione as medições e notas clínicas da sessão</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalConsultaOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {modalConsultaError && (
                <div className="mx-5 mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                  {modalConsultaError}
                </div>
              )}

              <form onSubmit={handleSalvarConsulta} className="p-5 space-y-4">
                {/* Data da consulta + Peso atual */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Data da Consulta *
                    </label>
                    <input
                      type="date"
                      required
                      value={consultaData}
                      onChange={(e) => setConsultaData(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Peso Atual (kg) *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      placeholder="Ex: 75.5"
                      value={consultaPeso}
                      onChange={(e) => setConsultaPeso(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Medidas opcionais: Cintura, Quadril, % Gordura */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Cintura (cm)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      placeholder="Opcional"
                      value={consultaCintura}
                      onChange={(e) => setConsultaCintura(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Quadril (cm)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      placeholder="Opcional"
                      value={consultaQuadril}
                      onChange={(e) => setConsultaQuadril(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                      % Gordura
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Opcional"
                      value={consultaGordura}
                      onChange={(e) => setConsultaGordura(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Próximo retorno */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Próximo Retorno (data prevista)
                  </label>
                  <input
                    type="date"
                    value={consultaRetorno}
                    onChange={(e) => setConsultaRetorno(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                {/* Observações */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Observações da Consulta
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Evolução, alterações na dieta, sintomas relatados..."
                    value={consultaObs}
                    onChange={(e) => setConsultaObs(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                  />
                </div>

                {/* Botões do modal */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalConsultaOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={isSavingConsulta}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-60"
                  >
                    {isSavingConsulta ? "Salvando..." : "Salvar consulta"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
