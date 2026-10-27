# RC Nutri - Plataforma de Gestão Nutricional

Sistema web moderno e completo para nutricionistas gerenciarem consultas, pacientes, anamneses e planos alimentares.

## 🚀 Tecnologias

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Lucide React
- **Roteamento:** React Router DOM v7
- **Banco de Dados:** Neon Serverless PostgreSQL (@neondatabase/serverless)
- **Autenticação:** Neon Auth (Better Auth)

## 🛠️ Configuração do Ambiente

1. Clone o repositório:
   ```bash
   git clone https://github.com/robsonrdcarlos-hash/app-rc-nutri.git
   cd app-rc-nutri
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Crie o arquivo `.env` baseado no `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Preencha as variáveis no `.env`:
   ```env
   VITE_NEON_AUTH_URL=https://<seu-endpoint>.neonauth.c-2.sa-east-1.aws.neon.tech/neondb/auth
   VITE_NEON_DATABASE_URL=postgresql://<user>:<password>@<seu-endpoint>-pooler.c-2.sa-east-1.aws.neon.tech/neondb?sslmode=require
   ```

5. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

## 📦 Build para Produção

```bash
npm run build
```

## 🔒 Segurança

- Credenciais de banco e autenticação são gerenciadas estritamente via variáveis de ambiente (`.env`).
- O arquivo `.env` está explicitamente protegido no `.gitignore` e não deve ser versionado.
- Domínios de produção (ex.: Vercel) devem ser cadastrados nos **Trusted Domains** do Neon Auth.
