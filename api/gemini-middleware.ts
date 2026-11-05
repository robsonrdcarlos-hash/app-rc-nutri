import type { Plugin } from 'vite';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { loadEnv } from 'vite';

export function geminiApiPlugin(): Plugin {
  let envConfig: Record<string, string> = {};

  return {
    name: 'gemini-api-plugin',
    configResolved(config) {
      envConfig = loadEnv(config.mode, process.cwd(), '');
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0];
        if (url !== '/api/gerar-plano') {
          return next();
        }

        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Method Not Allowed' }));
          return;
        }

        try {
          // Coleta o corpo da requisição
          let bodyStr = '';
          for await (const chunk of req) {
            bodyStr += chunk;
          }

          let payload: any = {};
          if (bodyStr) {
            try {
              payload = JSON.parse(bodyStr);
            } catch {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Invalid JSON body' }));
              return;
            }
          }

          const dadosPaciente = payload.dados_do_paciente || payload;
          const apiKey = process.env.GEMINI_API_KEY || envConfig.GEMINI_API_KEY;

          if (!apiKey) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'GEMINI_API_KEY não configurada no servidor.' }));
            return;
          }

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

          // Tenta primeiramente gemini-3.8-flash; se indisponível (503/404), usa gemini-3.5-flash com resiliência
          const modelsToTry = ['gemini-3.8-flash', 'gemini-3.5-flash'];
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
            throw lastError || new Error('Não foi possível obter resposta dos modelos do Gemini.');
          }

          // Validação robusta de JSON com try/catch
          let parsedData: any;
          try {
            // Remove possíveis delimitadores caso o LLM insira
            const cleanText = rawText.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
            parsedData = JSON.parse(cleanText);
          } catch (parseErr) {
            console.error('[gerar-plano] Erro no JSON.parse da resposta do Gemini:', parseErr, rawText);
            res.statusCode = 502;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              error: 'Resposta da IA não pôde ser convertida em JSON válido.',
              raw: rawText
            }));
            return;
          }

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(parsedData));
        } catch (error: any) {
          console.error('[gerar-plano] Erro ao processar:', error);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            error: error?.message || 'Erro interno ao gerar o plano alimentar com IA.'
          }));
        }
      });
    },
  };
}
