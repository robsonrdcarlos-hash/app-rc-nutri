import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY não configurada no servidor.' });
  }

  const dadosPaciente = req.body?.dados_do_paciente || req.body;
  const genAI = new GoogleGenerativeAI(apiKey);

  const prompt = `Você é um nutricionista clínico profissional especialista na culinária e rotina brasileira.
Gere um plano alimentar semanal completo, saudável e diversificado com base nos dados do paciente fornecidos abaixo.

Dados do Paciente (Metas, Alergias, Restrições e Histórico):
${typeof dadosPaciente === 'string' ? dadosPaciente : JSON.stringify(dadosPaciente, null, 2)}

# Regras Críticas de Execução:
- Você deve responder APENAS e estritamente o objeto JSON solicitado.
- Não inclua blocos de código markdown (como \`\`\`json ... \`\`\`), explicações, introduções ou textos complementares.
- Adapte o cardápio rigorosamente a quaisquer alergias ou restrições descritas nos dados.
- Utilize alimentos comuns, acessíveis e culturalmente aceitos no Brasil.
- Evite repetições monótonas de alimentos nos dias seguidos.

O formato do JSON retornado deve seguir exatamente esta estrutura:
{
  "plano_semanal": [
    {
      "dia": "Segunda-feira",
      "refeicoes": {
        "cafe_da_manha": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "lanche_manha": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "almoco": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "lanche_tarde": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "jantar": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"]
      }
    }
  ]
}`;

  // gemini-3.5-flash e gemini-3.5-flash-lite sao os modelos ativos e estaveis na conta
  const modelsToTry = [
    'gemini-3.5-flash',
    'gemini-3.5-flash-lite',
    'gemini-3.8-flash',
  ];
  let rawText = '';
  let lastError: any = null;

  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: 'application/json',
        },
      });

      const result = await model.generateContent(prompt);
      rawText = result.response.text();
      if (rawText) break;
    } catch (err: any) {
      lastError = err;
      console.warn(`[gerar-plano] Falha no modelo ${modelName}:`, err?.message || err);
    }
  }

  if (!rawText) {
    return res.status(500).json({
      error: lastError?.message || 'Não foi possível obter resposta dos modelos do Gemini.'
    });
  }

  try {
    const cleanText = rawText.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanText);
    return res.status(200).json(parsed);
  } catch (parseErr) {
    console.error('[gerar-plano] Erro ao parsear JSON:', parseErr, rawText);
    return res.status(502).json({
      error: 'Resposta da IA não pôde ser convertida em JSON válido.',
      raw: rawText
    });
  }
}

