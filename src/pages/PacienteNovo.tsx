import React, { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { createPaciente, createConsulta } from "@/lib/db";
import {
  User,
  Activity,
  HeartPulse,
  Save,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Plus,
  X,
  Sparkles,
} from "lucide-react";

// Opções predefinidas conforme especificação do Prompt 4
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

export const PacienteNovo: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Aba ativa: 'pessoal' | 'clinico' | 'habitos'
  const [activeTab, setActiveTab] = useState<"pessoal" | "clinico" | "habitos">("pessoal");

  // Estado do formulário
  // Aba 1 — Pessoal
  const [nome, setNome] = useState("");
  const [dataInicioTratamento, setDataInicioTratamento] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [dataNascimento, setDataNascimento] = useState("");
  const [sexo, setSexo] = useState<"Feminino" | "Masculino" | "Outro" | "">("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");

  // Aba 2 — Clínico
  const [peso, setPeso] = useState<string>("");
  const [altura, setAltura] = useState<string>("");
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

  // Aba 3 — Hábitos
  const [refeicoesPorDia, setRefeicoesPorDia] = useState<string>("");
  const [horarioAcorda, setHorarioAcorda] = useState("");
  const [horarioDorme, setHorarioDorme] = useState("");
  const [litrosAgua, setLitrosAgua] = useState<string>("");
  const [praticaAtividade, setPraticaAtividade] = useState<boolean | null>(null);
  const [atividadeDescricao, setAtividadeDescricao] = useState("");
  const [observacoes, setObservacoes] = useState("");

  // Estados de submissão e feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // 1. Cálculo automático da idade a partir da data de nascimento
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
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDay)) {
      age--;
    }
    return age >= 0 ? age : null;
  }, [dataNascimento]);

  // 2. Máscara de formatação para WhatsApp: (99) 99999-9999
  const handleWhatsappChange = (val: string) => {
    const raw = val.replace(/\D/g, "").slice(0, 11);
    let formatted = raw;
    if (raw.length > 2) {
      formatted = `(${raw.slice(0, 2)}) ${raw.slice(2)}`;
    }
    if (raw.length > 7) {
      formatted = `(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7, 11)}`;
    }
    setWhatsapp(formatted);
  };

  // 3. Cálculo automático do IMC a partir do peso (kg) e altura (cm)
  const imcInfo = useMemo(() => {
    const p = parseFloat(peso.replace(",", "."));
    const aCm = parseFloat(altura.replace(",", "."));

    if (p > 0 && aCm > 0) {
      const aM = aCm / 100;
      const imc = p / (aM * aM);
      const imcFormatado = imc.toFixed(1);

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
      } else if (imc < 35) {
        classificacao = "Obesidade Grau I";
        cor = "text-orange-700 bg-orange-50 border-orange-200";
      } else if (imc < 40) {
        classificacao = "Obesidade Grau II";
        cor = "text-red-700 bg-red-50 border-red-200";
      } else {
        classificacao = "Obesidade Grau III";
        cor = "text-red-800 bg-red-100 border-red-300";
      }

      return { valor: imcFormatado, classificacao, cor };
    }
    return null;
  }, [peso, altura]);

  // 4. Conversão automática de horário: 6 → "06:00", 630 → "06:30", 23 → "23:00"
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

    if (digits.length === 1 || digits.length === 2) {
      const h = Math.min(parseInt(digits, 10), 23);
      return `${String(h).padStart(2, "0")}:00`;
    }

    if (digits.length === 3) {
      const h = Math.min(parseInt(digits.slice(0, 1), 10), 23);
      const m = Math.min(parseInt(digits.slice(1), 10), 59);
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    }

    if (digits.length >= 4) {
      const h = Math.min(parseInt(digits.slice(0, 2), 10), 23);
      const m = Math.min(parseInt(digits.slice(2, 4), 10), 59);
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    }

    return trimmed;
  };

  // Funções de alternância de chips (múltipla escolha)
  const toggleArrayItem = (
    currentList: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    item: string
  ) => {
    if (item === "Nenhum") {
      if (currentList.includes("Nenhum")) {
        setList([]);
      } else {
        setList(["Nenhum"]);
      }
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

  // Submissão do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setErrorMessage("Você precisa estar autenticado para salvar.");
      return;
    }

    if (!nome.trim()) {
      setErrorMessage("O campo 'Nome completo' é obrigatório.");
      setActiveTab("pessoal");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const pesoNum = peso ? parseFloat(peso.replace(",", ".")) : null;
      const alturaNum = altura ? parseFloat(altura.replace(",", ".")) : null;
      const refeicoesNum = refeicoesPorDia ? parseInt(refeicoesPorDia, 10) : null;
      const litrosNum = litrosAgua ? parseFloat(litrosAgua.replace(",", ".")) : null;

      const novoPaciente = await createPaciente(user.id, user.email, {
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

      // Se houver data de início do tratamento e peso informado, registra a primeira consulta
      if (dataInicioTratamento && !isNaN(Number(pesoNum)) && Number(pesoNum) > 0) {
        try {
          await createConsulta({
            paciente_id: novoPaciente.id,
            data_consulta: dataInicioTratamento,
            peso: Number(pesoNum),
            observacoes: "Primeira consulta (início do tratamento)",
          });
        } catch (consultaErr) {
          console.warn("Nota: Não foi possível salvar consulta inicial:", consultaErr);
        }
      }

      setSuccessMessage("Paciente cadastrado com sucesso!");

      // Redireciona para o perfil do paciente recém cadastrado após breve confirmação
      setTimeout(() => {
        navigate(`/pacientes/${novoPaciente.id}`);
      }, 900);
    } catch (err: any) {
      console.error("Erro ao salvar paciente:", err);
      setErrorMessage("Erro ao salvar paciente no banco de dados. Tente novamente.");
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Topo / Voltar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <Link
              to="/pacientes"
              className="p-2 rounded-xl border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 transition-colors shadow-sm"
              title="Voltar para listagem"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200/80 mb-1">
                <Sparkles className="h-3 w-3 text-emerald-600" />
                Novo Cadastro
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Cadastrar Paciente
              </h1>
              <p className="text-xs text-slate-500">
                Apenas o <strong>Nome completo</strong> é obrigatório. Preencha os demais dados conforme a anamnese.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition-all disabled:opacity-60 self-start sm:self-auto cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Salvando no Neon...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Salvar Paciente
              </>
            )}
          </button>
        </div>

        {/* Notificações de Sucesso ou Erro */}
        {successMessage && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3 animate-fade-in shadow-sm">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-sm font-bold">{successMessage}</p>
              <p className="text-xs text-emerald-700">Redirecionando para o perfil do paciente...</p>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-center gap-3 shadow-sm">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
            <p className="text-sm font-medium">{errorMessage}</p>
          </div>
        )}

        {/* Abas do formulário */}
        <div className="flex border-b border-slate-200 gap-2 bg-slate-100/70 p-1.5 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab("pessoal")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "pessoal"
                ? "bg-white text-emerald-700 shadow-sm border border-slate-200/80"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <User className="h-4 w-4" />
            1. Pessoal
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("clinico")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "clinico"
                ? "bg-white text-emerald-700 shadow-sm border border-slate-200/80"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Activity className="h-4 w-4" />
            2. Clínico
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("habitos")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "habitos"
                ? "bg-white text-emerald-700 shadow-sm border border-slate-200/80"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <HeartPulse className="h-4 w-4" />
            3. Hábitos
          </button>
        </div>

        {/* Formulário Principal */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          {/* ============================================================ */}
          {/* ABA 1 — PESSOAL */}
          {/* ============================================================ */}
          {activeTab === "pessoal" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-900">Dados Pessoais</h2>
                <p className="text-xs text-slate-500">Identificação básica e informações de contato do paciente</p>
              </div>

              {/* Nome completo e Data de início do tratamento */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Nome Completo <span className="text-red-500">* (obrigatório)</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: Maria Clara Souza"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Início do Tratamento
                  </label>
                  <input
                    type="date"
                    value={dataInicioTratamento}
                    onChange={(e) => setDataInicioTratamento(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Registrada como primeira consulta
                  </span>
                </div>
              </div>

              {/* Data de nascimento + Idade calculada */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Data de Nascimento
                  </label>
                  <input
                    type="date"
                    value={dataNascimento}
                    onChange={(e) => setDataNascimento(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                  {idadeCalculada !== null && (
                    <p className="text-xs font-semibold text-emerald-700 mt-1.5 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Idade calculada: <strong>{idadeCalculada} anos</strong>
                    </p>
                  )}
                </div>

                {/* Sexo */}
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
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                            : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* WhatsApp e Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    WhatsApp (formatado)
                  </label>
                  <input
                    type="text"
                    value={whatsapp}
                    onChange={(e) => handleWhatsappChange(e.target.value)}
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-mono"
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
                    placeholder="paciente@exemplo.com"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              {/* Botão para avançar */}
              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveTab("clinico")}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                >
                  Próxima aba: Clínico →
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* ABA 2 — CLÍNICO */}
          {/* ============================================================ */}
          {activeTab === "clinico" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-900">Dados Clínicos &amp; Antropometria</h2>
                <p className="text-xs text-slate-500">Métricas corporais, objetivos e histórico patológico</p>
              </div>

              {/* Peso, Altura e IMC Automático */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Peso atual
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={peso}
                      onChange={(e) => setPeso(e.target.value)}
                      placeholder="Ex: 72.5"
                      className="w-full pl-4 pr-12 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    />
                    <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs font-bold text-slate-400 pointer-events-none">
                      kg
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Altura
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={altura}
                      onChange={(e) => setAltura(e.target.value)}
                      placeholder="Ex: 175"
                      className="w-full pl-4 pr-12 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    />
                    <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs font-bold text-slate-400 pointer-events-none">
                      cm
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    IMC (calculado automaticamente)
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
                      <span className="text-xs text-slate-400">Informe peso e altura</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Objetivos (Múltipla escolha + campo livre) */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Objetivo Principal (selecione um ou mais)
                </label>
                <div className="flex flex-wrap gap-2">
                  {OBJETIVOS_PREDEFINIDOS.map((obj) => {
                    const isSelected = objetivos.includes(obj);
                    return (
                      <button
                        key={obj}
                        type="button"
                        onClick={() =>
                          toggleArrayItem(objetivos, setObjetivos, obj)
                        }
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                            : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {obj}
                      </button>
                    );
                  })}
                </div>
                <input
                  type="text"
                  value={objetivoTexto}
                  onChange={(e) => setObjetivoTexto(e.target.value)}
                  placeholder="Observação adicional sobre o objetivo (opcional)..."
                  className="w-full mt-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>

              {/* Nível de atividade física */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Nível de Atividade Física
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {NIVEIS_ATIVIDADE.map((nivel) => (
                    <button
                      key={nivel}
                      type="button"
                      onClick={() => setNivelAtividade(nivelAtividade === nivel ? "" : nivel)}
                      className={`p-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer text-center ${
                        nivelAtividade === nivel
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {nivel}
                    </button>
                  ))}
                </div>
              </div>

              {/* Patologias ou condições de saúde */}
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
                  {PATOLOGIAS_PREDEFINIDAS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleArrayItem(patologias, setPatologias, item)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        patologias.includes(item)
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                  {/* Chips customizados adicionados */}
                  {patologias
                    .filter((p) => p !== "Nenhum" && !PATOLOGIAS_PREDEFINIDAS.includes(p))
                    .map((custom) => (
                      <span
                        key={custom}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300"
                      >
                        {custom}
                        <button
                          type="button"
                          onClick={() => setPatologias(patologias.filter((x) => x !== custom))}
                          className="hover:text-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                </div>
                {/* Campo para adicionar livremente */}
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={novaPatologia}
                    onChange={(e) => setNovaPatologia(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddCustomItem(novaPatologia, setNovaPatologia, patologias, setPatologias);
                      }
                    }}
                    placeholder="Adicionar outra patologia..."
                    className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddCustomItem(novaPatologia, setNovaPatologia, patologias, setPatologias)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors inline-flex items-center gap-1"
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
                  {RESTRICOES_PREDEFINIDAS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleArrayItem(restricoes, setRestricoes, item)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        restricoes.includes(item)
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                  {restricoes
                    .filter((r) => r !== "Nenhum" && !RESTRICOES_PREDEFINIDAS.includes(r))
                    .map((custom) => (
                      <span
                        key={custom}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300"
                      >
                        {custom}
                        <button
                          type="button"
                          onClick={() => setRestricoes(restricoes.filter((x) => x !== custom))}
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
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddCustomItem(novaRestricao, setNovaRestricao, restricoes, setRestricoes);
                      }
                    }}
                    placeholder="Adicionar outra restrição alimentar..."
                    className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddCustomItem(novaRestricao, setNovaRestricao, restricoes, setRestricoes)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors inline-flex items-center gap-1"
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
                  {ALERGIAS_PREDEFINIDAS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleArrayItem(alergias, setAlergias, item)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        alergias.includes(item)
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                  {alergias
                    .filter((a) => a !== "Nenhum" && !ALERGIAS_PREDEFINIDAS.includes(a))
                    .map((custom) => (
                      <span
                        key={custom}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300"
                      >
                        {custom}
                        <button
                          type="button"
                          onClick={() => setAlergias(alergias.filter((x) => x !== custom))}
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
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddCustomItem(novaAlergia, setNovaAlergia, alergias, setAlergias);
                      }
                    }}
                    placeholder="Adicionar outra alergia alimentar..."
                    className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddCustomItem(novaAlergia, setNovaAlergia, alergias, setAlergias)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors inline-flex items-center gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" /> Adicionar
                  </button>
                </div>
              </div>

              {/* Medicamentos contínuos e Suplementos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Medicamentos contínuos (texto livre)
                  </label>
                  <textarea
                    rows={2}
                    value={medicamentos}
                    onChange={(e) => setMedicamentos(e.target.value)}
                    placeholder="Ex: Losartana 50mg pela manhã, Metformina 850mg..."
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Suplementos em uso (texto livre)
                  </label>
                  <textarea
                    rows={2}
                    value={suplementos}
                    onChange={(e) => setSuplementos(e.target.value)}
                    placeholder="Ex: Creatina 5g pós-treino, Whey Protein isolado, Vitamina D..."
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                  />
                </div>
              </div>

              {/* Botão de navegação */}
              <div className="pt-4 border-t border-slate-100 flex justify-between">
                <button
                  type="button"
                  onClick={() => setActiveTab("pessoal")}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  ← Aba anterior: Pessoal
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("habitos")}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                >
                  Próxima aba: Hábitos →
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* ABA 3 — HÁBITOS */}
          {/* ============================================================ */}
          {activeTab === "habitos" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-900">Rotina e Hábitos de Vida</h2>
                <p className="text-xs text-slate-500">Sono, hidratação, exercícios e rotina diária de alimentação</p>
              </div>

              {/* Refeições e Água */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Quantas refeições faz por dia
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={refeicoesPorDia}
                    onChange={(e) => setRefeicoesPorDia(e.target.value)}
                    placeholder="Ex: 4"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Quantidade de água por dia
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={litrosAgua}
                      onChange={(e) => setLitrosAgua(e.target.value)}
                      placeholder="Ex: 2.5"
                      className="w-full pl-4 pr-16 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    />
                    <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs font-bold text-slate-400 pointer-events-none">
                      litros
                    </span>
                  </div>
                </div>
              </div>

              {/* Horário de acordar e dormir (com formatação automática) */}
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
                    placeholder="Ex: 6 (vira 06:00) ou 630 (vira 06:30)"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono transition-all"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Digite o número que o sistema converte automaticamente para hh:mm
                  </span>
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
                    placeholder="Ex: 23 (vira 23:00) ou 2230 (vira 22:30)"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono transition-all"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Digite o número que o sistema converte automaticamente para hh:mm
                  </span>
                </div>
              </div>

              {/* Pratica atividade física (sim/não) */}
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
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
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
                        ? "bg-slate-700 text-white border-slate-700 shadow-sm"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    Não
                  </button>
                </div>

                {praticaAtividade && (
                  <div className="pt-2 animate-fade-in">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Qual atividade e frequência semanal?
                    </label>
                    <input
                      type="text"
                      value={atividadeDescricao}
                      onChange={(e) => setAtividadeDescricao(e.target.value)}
                      placeholder="Ex: Musculação 4x na semana + Corrida aos sábados"
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                )}
              </div>

              {/* Observações gerais */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Observações Gerais (texto livre)
                </label>
                <textarea
                  rows={3}
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Informações adicionais, particularidades da rotina ou preferências do paciente..."
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                />
              </div>

              {/* Botões de Ação Final */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setActiveTab("clinico")}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  ← Aba anterior: Clínico
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition-all disabled:opacity-60 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Salvar Cadastro
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </DashboardLayout>
  );
};
