import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Save,
  Calendar,
  Utensils,
  ChevronRight,
  AlertCircle,
  FileText,
  Clock,
  CheckCircle2,
  Edit3,
} from 'lucide-react';
import { PlanoAlimentar, createPlanoAlimentar } from '@/lib/db';
import { formatSafeDate } from '@/lib/utils';

export interface RefeicoesDia {
  cafe_da_manha: string[];
  lanche_manha: string[];
  almoco: string[];
  lanche_tarde: string[];
  jantar: string[];
}

export interface DiaPlano {
  dia: string;
  refeicoes: RefeicoesDia;
}

export interface PlanoSemanalData {
  plano_semanal: DiaPlano[];
}

interface PlanosAlimentaresSectionProps {
  paciente: any;
  planos: PlanoAlimentar[];
  onPlanoSalvo: (novoPlano: PlanoAlimentar) => void;
}

const DIAS_PADRAO = [
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
  'Domingo',
];

const NOMES_REFEICOES: Record<keyof RefeicoesDia, string> = {
  cafe_da_manha: 'Café da Manhã',
  lanche_manha: 'Lanche da Manhã',
  almoco: 'Almoço',
  lanche_tarde: 'Lanche da Tarde',
  jantar: 'Jantar',
};

const MENSAGENS_LOADING = [
  'Buscando dados e restrições do paciente...',
  'Consultando histórico e preferências nutricionais...',
  'IA calculando cardápio equilibrado com a culinária brasileira...',
  'Estruturando plano alimentar semanal em 5 refeições diárias...',
  'Finalizando opções e preparando interface de edição...',
];

function criarPlanoVazio(): PlanoSemanalData {
  return {
    plano_semanal: DIAS_PADRAO.map((dia) => ({
      dia,
      refeicoes: {
        cafe_da_manha: ['', '', '', '', ''],
        lanche_manha: ['', '', '', '', ''],
        almoco: ['', '', '', '', ''],
        lanche_tarde: ['', '', '', '', ''],
        jantar: ['', '', '', '', ''],
      },
    })),
  };
}

export const PlanosAlimentaresSection: React.FC<PlanosAlimentaresSectionProps> = ({
  paciente,
  planos,
  onPlanoSalvo,
}) => {
  // Estado do plano ativo na edição (seja gerado por IA ou criado manualmente)
  const [planoEdicao, setPlanoEdicao] = useState<PlanoSemanalData | null>(null);
  const [diaAtivoIndex, setDiaAtivoIndex] = useState<number>(0);

  // Estados de IA e Carregamento
  const [isGerandoIA, setIsGerandoIA] = useState<boolean>(false);
  const [mensagemLoading, setMensagemLoading] = useState<string>(MENSAGENS_LOADING[0]);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'error' | 'success'; text: string; showManualAction?: boolean } | null>(null);

  // Histórico de planos
  const [planoVisualizando, setPlanoVisualizando] = useState<PlanoAlimentar | null>(null);

  // Rotação dinâmica de mensagens no Loading visual
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGerandoIA) {
      let idx = 0;
      setMensagemLoading(MENSAGENS_LOADING[0]);
      interval = setInterval(() => {
        idx = (idx + 1) % MENSAGENS_LOADING.length;
        setMensagemLoading(MENSAGENS_LOADING[idx]);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [isGerandoIA]);

  // Função para normalizar dados recebidos da IA ou do banco
  const normalizarPlanoData = (data: any): PlanoSemanalData => {
    if (!data || !Array.isArray(data.plano_semanal)) {
      throw new Error('Formato do plano inválido');
    }

    const planoNormalizado: DiaPlano[] = data.plano_semanal.map((item: any, i: number) => {
      const diaNome = item.dia || DIAS_PADRAO[i] || `Dia ${i + 1}`;
      const ref = item.refeicoes || {};
      const fixArray = (arr: any) => {
        const list = Array.isArray(arr) ? arr.map(String) : [];
        while (list.length < 5) list.push('');
        return list.slice(0, 5);
      };

      return {
        dia: diaNome,
        refeicoes: {
          cafe_da_manha: fixArray(ref.cafe_da_manha),
          lanche_manha: fixArray(ref.lanche_manha),
          almoco: fixArray(ref.almoco),
          lanche_tarde: fixArray(ref.lanche_tarde),
          jantar: fixArray(ref.jantar),
        },
      };
    });

    return { plano_semanal: planoNormalizado };
  };

  // 1. Gerar Plano com IA
  const handleGerarPlanoIA = async () => {
    setIsGerandoIA(true);
    setToastMessage(null);

    // Constrói payload com dados do paciente para a IA
    const dadosPacienteFormatados = {
      nome: paciente?.nome,
      idade: paciente?.data_nascimento,
      sexo: paciente?.sexo,
      peso_atual: paciente?.peso_inicial,
      altura: paciente?.altura,
      objetivos: paciente?.objetivos,
      objetivo_detalhado: paciente?.objetivo_texto,
      nivel_atividade: paciente?.nivel_atividade,
      patologias: paciente?.patologias,
      restricoes_alimentares: paciente?.restricoes_alimentares,
      alergias: paciente?.alergias,
      refeicoes_por_dia: paciente?.refeicoes_por_dia,
      horarios: {
        acorda: paciente?.horario_acorda,
        dorme: paciente?.horario_dorme,
      },
      agua_litros: paciente?.litros_agua,
      atividade_fisica: paciente?.atividade_fisica_descricao,
      observacoes_clinicas: paciente?.observacoes,
    };

    // Controller para timeout de 45 segundos
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);

    try {
      const response = await fetch('/api/gerar-plano', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dados_do_paciente: dadosPacienteFormatados }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: Falha ao processar solicitação.`);
      }

      const jsonResult = await response.json();
      const planoValidado = normalizarPlanoData(jsonResult);

      setPlanoEdicao(planoValidado);
      setDiaAtivoIndex(0);
      setToastMessage({
        type: 'success',
        text: 'Plano alimentar gerado com sucesso pela IA! Você pode editá-lo antes de salvar.',
      });
    } catch (err: any) {
      console.error('Erro ao gerar plano alimentar com IA:', err);
      setToastMessage({
        type: 'error',
        text: 'Não foi possível gerar o plano com IA no momento. Deseja tentar novamente ou criar um Plano Manual?',
        showManualAction: true,
      });
    } finally {
      setIsGerandoIA(false);
    }
  };

  // 2. Criar Plano Manualmente (Fallback resiliente)
  const handleCriarPlanoManual = () => {
    setPlanoEdicao(criarPlanoVazio());
    setDiaAtivoIndex(0);
    setToastMessage({
      type: 'success',
      text: 'Estrutura manual criada. Preencha os campos e salve quando terminar.',
    });
  };

  // 3. Ajuste de valor de uma opção de refeição
  const handleOpcaoChange = (
    refeicaoKey: keyof RefeicoesDia,
    opcaoIndex: number,
    novoValor: string
  ) => {
    if (!planoEdicao) return;

    setPlanoEdicao((prev) => {
      if (!prev) return prev;
      const clone = JSON.parse(JSON.stringify(prev)) as PlanoSemanalData;
      const diaObj = clone.plano_semanal[diaAtivoIndex];
      if (diaObj && diaObj.refeicoes[refeicaoKey]) {
        diaObj.refeicoes[refeicaoKey][opcaoIndex] = novoValor;
      }
      return clone;
    });
  };

  // 4. Persistir plano no Neon DB
  const handleSalvarPlano = async () => {
    if (!planoEdicao || !paciente?.id) return;

    setIsSaving(true);
    setToastMessage(null);

    try {
      const saved = await createPlanoAlimentar(paciente.id, planoEdicao);

      onPlanoSalvo(saved);
      setPlanoEdicao(null); // Volta ao modo de exibição
      setPlanoVisualizando(saved);
      setToastMessage({
        type: 'success',
        text: 'Plano alimentar salvo com sucesso no banco de dados!',
      });
    } catch (err: any) {
      console.error('Erro ao salvar plano no Neon:', err);
      setToastMessage({
        type: 'error',
        text: 'Ocorreu um erro ao persistir o plano alimentar. Tente novamente.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const diaAtual = planoEdicao?.plano_semanal[diaAtivoIndex];

  return (
    <div className="space-y-6">
      {/* Toast de Notificação / Feedback */}
      {toastMessage && (
        <div
          className={`p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 border transition-all ${
            toastMessage.type === 'error'
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}
        >
          <div className="flex items-center gap-3">
            {toastMessage.type === 'error' ? (
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            )}
            <p className="text-xs sm:text-sm font-medium">{toastMessage.text}</p>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            {toastMessage.showManualAction && (
              <>
                <button
                  type="button"
                  onClick={handleGerarPlanoIA}
                  className="px-3 py-1.5 rounded-xl bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 transition-colors cursor-pointer"
                >
                  Tentar Novamente
                </button>
                <button
                  type="button"
                  onClick={handleCriarPlanoManual}
                  className="px-3 py-1.5 rounded-xl bg-white border border-amber-300 text-amber-900 text-xs font-semibold hover:bg-amber-100/50 transition-colors cursor-pointer"
                >
                  Criar Plano Manual
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="text-xs text-slate-400 hover:text-slate-600 p-1"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* PAINEL PRINCIPAL DE PLANOS */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        {/* Cabeçalho da Seção */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Utensils className="h-5 w-5 text-emerald-600" />
              Planos Alimentares
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Gere cardápios semanais com IA ou consulte o histórico completo do paciente
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {planoEdicao && (
              <button
                type="button"
                onClick={handleSalvarPlano}
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {isSaving ? 'Salvando...' : 'Salvar Plano Alimentar'}
              </button>
            )}

            <button
              type="button"
              onClick={handleGerarPlanoIA}
              disabled={isGerandoIA}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md shadow-emerald-600/25 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles className={`h-4 w-4 ${isGerandoIA ? 'animate-spin' : ''}`} />
              ✨ Gerar Plano com IA
            </button>

            {!planoEdicao && (
              <button
                type="button"
                onClick={handleCriarPlanoManual}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <Edit3 className="h-4 w-4" />
                Criar Manual
              </button>
            )}
          </div>
        </div>

        {/* LOADING VISUAL COM MENSAGENS DINÂMICAS */}
        {isGerandoIA && (
          <div className="p-10 rounded-2xl bg-gradient-to-br from-emerald-50/70 via-teal-50/40 to-slate-50 border border-emerald-200 text-center space-y-4 animate-fade-in">
            <div className="relative inline-flex items-center justify-center">
              <div className="h-14 w-14 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
              <Sparkles className="h-6 w-6 text-emerald-600 absolute" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-bold text-slate-900">Gerando Cardápio Semanal com IA</h4>
              <p className="text-sm font-medium text-emerald-800 transition-all duration-300">
                {mensagemLoading}
              </p>
            </div>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Considerando objetivos, restrições alimentares, alergias e a rotina nutricional de{' '}
              <strong>{paciente?.nome || 'paciente'}</strong>.
            </p>
          </div>
        )}

        {/* INTERFACE DE EDIÇÃO EM ABAS (TABS) */}
        {planoEdicao && !isGerandoIA && (
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4">
              <div>
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">
                  Edição do Plano Gerado
                </span>
                <h4 className="text-base font-bold text-slate-900">
                  Cardápio Semanal Interativo (5 Opções por Refeição)
                </h4>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Deseja descartar as alterações do plano em edição?')) {
                      setPlanoEdicao(null);
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancelar Edição
                </button>
                <button
                  type="button"
                  onClick={handleSalvarPlano}
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-colors cursor-pointer"
                >
                  <Save className="h-3.5 w-3.5" />
                  Salvar
                </button>
              </div>
            </div>

            {/* ABAS (TABS) DOS DIAS DA SEMANA */}
            <div className="flex overflow-x-auto gap-2 pb-2 border-b border-slate-200 no-scrollbar">
              {planoEdicao.plano_semanal.map((diaItem, idx) => {
                const isActive = diaAtivoIndex === idx;
                return (
                  <button
                    key={diaItem.dia || idx}
                    type="button"
                    onClick={() => setDiaAtivoIndex(idx)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                        : 'bg-white text-slate-700 hover:bg-slate-200/70 border border-slate-200'
                    }`}
                  >
                    {diaItem.dia}
                  </button>
                );
              })}
            </div>

            {/* REFEIÇÕES DO DIA ATIVO COM 5 INPUTS CADA */}
            {diaAtual && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h5 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-emerald-600" />
                    Refeições para {diaAtual.dia}
                  </h5>
                  <span className="text-xs text-slate-500">
                    Edite ou personalize qualquer uma das opções diretamente nos campos abaixo:
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {(Object.keys(NOMES_REFEICOES) as Array<keyof RefeicoesDia>).map((refKey) => {
                    const opcoes = diaAtual.refeicoes[refKey] || ['', '', '', '', ''];
                    return (
                      <div
                        key={refKey}
                        className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
                            {NOMES_REFEICOES[refKey]}
                          </label>
                          <span className="text-[11px] text-slate-400 font-medium">
                            5 alternativas
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                          {opcoes.map((opcaoTexto, opIdx) => (
                            <div key={opIdx} className="space-y-1">
                              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                                Opção {opIdx + 1}
                              </span>
                              <textarea
                                rows={3}
                                value={opcaoTexto}
                                onChange={(e) => handleOpcaoChange(refKey, opIdx, e.target.value)}
                                placeholder={`Opção ${opIdx + 1} de refeição`}
                                className="w-full px-3 py-2 text-xs bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none transition-all"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* LISTA DE HISTÓRICOS DE PLANOS ALIMENTARES */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText className="h-4 w-4 text-slate-500" />
              Histórico de Planos Salvos ({planos.length})
            </h4>
            <span className="text-xs text-slate-400">Ordenados do mais recente ao mais antigo</span>
          </div>

          {planos.length === 0 ? (
            <div className="py-12 text-center bg-slate-50/60 rounded-2xl border border-slate-200/80">
              <FileText className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">Nenhum plano alimentar gerado ainda</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Clique no botão "✨ Gerar Plano com IA" acima para criar o primeiro cardápio baseado nas
                preferências deste paciente.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {planos.map((plano) => {
                const isSelected = planoVisualizando?.id === plano.id;
                let resumoDias = '';
                try {
                  const parsed = typeof plano.conteudo === 'string' ? JSON.parse(plano.conteudo) : plano.conteudo;
                  if (parsed?.plano_semanal) {
                    resumoDias = `${parsed.plano_semanal.length} dias estruturados`;
                  }
                } catch {
                  resumoDias = 'Plano customizado';
                }

                return (
                  <div
                    key={plano.id}
                    onClick={() => setPlanoVisualizando(plano)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/50 shadow-sm ring-1 ring-emerald-400'
                        : 'border-slate-200 bg-white hover:border-emerald-300 hover:bg-slate-50/80 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Plano Salvo
                      </span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatSafeDate(plano.created_at)}
                      </span>
                    </div>

                    <p className="text-xs font-medium text-slate-700 mb-1">
                      {resumoDias || 'Cardápio semanal completo'}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                      <span>Clique para visualizar</span>
                      <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* VISUALIZAÇÃO COMPLETA DO PLANO HISTÓRICO SELECIONADO */}
        {planoVisualizando && (
          <div className="mt-6 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">
                  Consulta de Histórico
                </span>
                <h4 className="text-base font-bold text-slate-900">
                  Plano Alimentar • {formatSafeDate(planoVisualizando.created_at)}
                </h4>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    try {
                      const parsed =
                        typeof planoVisualizando.conteudo === 'string'
                          ? JSON.parse(planoVisualizando.conteudo)
                          : planoVisualizando.conteudo;
                      setPlanoEdicao(normalizarPlanoData(parsed));
                      setDiaAtivoIndex(0);
                      setToastMessage({
                        type: 'success',
                        text: 'Plano carregado no editor! Você pode ajustar e salvar uma nova versão.',
                      });
                    } catch (e) {
                      alert('Não foi possível carregar para edição.');
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
                >
                  Carregar no Editor
                </button>
                <button
                  type="button"
                  onClick={() => setPlanoVisualizando(null)}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>

            {/* Exibição Estruturada em Cards / Tabs */}
            {(() => {
              let dados: any = null;
              try {
                dados =
                  typeof planoVisualizando.conteudo === 'string'
                    ? JSON.parse(planoVisualizando.conteudo)
                    : planoVisualizando.conteudo;
              } catch {
                dados = null;
              }

              if (dados?.plano_semanal && Array.isArray(dados.plano_semanal)) {
                return (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {dados.plano_semanal.map((diaItem: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3"
                        >
                          <h6 className="text-xs font-bold uppercase tracking-wider text-emerald-800 border-b border-slate-200 pb-1.5">
                            {diaItem.dia || `Dia ${idx + 1}`}
                          </h6>
                          <div className="space-y-2 text-xs">
                            {diaItem.refeicoes &&
                              Object.entries(diaItem.refeicoes).map(([refKey, opList]: [string, any]) => (
                                <div key={refKey} className="space-y-0.5">
                                  <span className="font-bold text-slate-700 capitalize">
                                    {NOMES_REFEICOES[refKey as keyof RefeicoesDia] || refKey}:
                                  </span>
                                  <ul className="list-disc list-inside text-slate-600 pl-1 space-y-0.5">
                                    {Array.isArray(opList) ? (
                                      opList
                                        .filter((op: string) => op && op.trim() !== '')
                                        .map((op: string, oIdx: number) => <li key={oIdx}>{op}</li>)
                                    ) : (
                                      <li>{String(opList)}</li>
                                    )}
                                  </ul>
                                </div>
                              ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }

              // Fallback para JSON cru caso venha em outro formato
              return (
                <pre className="text-xs text-slate-700 whitespace-pre-wrap font-mono bg-slate-50 p-4 rounded-xl border border-slate-200 overflow-x-auto max-h-96">
                  {typeof planoVisualizando.conteudo === 'string'
                    ? planoVisualizando.conteudo
                    : JSON.stringify(planoVisualizando.conteudo, null, 2)}
                </pre>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
};
