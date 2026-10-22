import { neon } from "@neondatabase/serverless";

// Carrega a URL do banco a partir das variáveis de ambiente
const databaseUrl =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_NEON_DATABASE_URL) ||
  "";

if (!databaseUrl) {
  console.warn("Aviso: VITE_NEON_DATABASE_URL não configurada no ambiente.");
}

// Neon serverless SQL query runner over HTTP
export const sql = neon(databaseUrl);

export interface Nutricionista {
  id: string;
  nome: string;
  email: string;
  created_at: string;
}

export interface Paciente {
  id: string;
  nutricionista_id: string;
  nome: string;
  data_nascimento?: string | null;
  sexo?: string | null;
  telefone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  peso_inicial?: number | null;
  altura?: number | null;
  objetivos?: string[] | null;
  objetivo_texto?: string | null;
  nivel_atividade?: string | null;
  patologias?: string[] | null;
  restricoes_alimentares?: string[] | null;
  alergias?: string[] | null;
  medicamentos?: string | null;
  suplementos?: string | null;
  refeicoes_por_dia?: number | null;
  horario_acorda?: string | null;
  horario_dorme?: string | null;
  litros_agua?: number | null;
  atividade_fisica?: boolean | null;
  atividade_fisica_descricao?: string | null;
  observacoes?: string | null;
  created_at?: string;
}

export interface PacienteListItem {
  id: string;
  nome: string;
  objetivos: string[];
  objetivo_texto: string | null;
  data_nascimento?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  ultima_consulta: string | null;
  created_at: string;
}

export interface Consulta {
  id: string;
  paciente_id: string;
  data_consulta: string;
  peso?: number | null;
  cintura?: number | null;
  quadril?: number | null;
  percentual_gordura?: number | null;
  observacoes?: string | null;
  proximo_retorno?: string | null;
  created_at?: string;
}

export interface PacienteSemRetorno {
  paciente_id: string;
  paciente_nome: string;
  paciente_email?: string | null;
  paciente_telefone?: string | null;
  ultima_consulta: string; // ISO date string
  dias_desde_ultima_consulta: number;
}

export interface DashboardMetrics {
  totalPacientes: number;
  consultasSemana: number;
  pacientesSemRetorno: PacienteSemRetorno[];
}

/**
 * Ensures the logged in user is synced into the `nutricionistas` table.
 * If not exists, inserts and returns the row.
 */
export async function getOrCreateNutricionista(
  userId: string,
  email: string,
  nome: string
): Promise<Nutricionista> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = nome.trim() || "Nutricionista";

  try {
    // Check by email or id
    const existing = await sql(
      `SELECT id, nome, email, created_at 
       FROM nutricionistas 
       WHERE LOWER(email) = LOWER($1) OR id::text = $2
       LIMIT 1`,
      [cleanEmail, userId]
    );

    if (existing && existing.length > 0) {
      return existing[0] as Nutricionista;
    }

    // Insert new nutricionista
    const inserted = await sql(
      `INSERT INTO nutricionistas (id, nome, email)
       VALUES ($1::uuid, $2, $3)
       ON CONFLICT (email) DO UPDATE 
         SET nome = EXCLUDED.nome
       RETURNING id, nome, email, created_at`,
      [userId, cleanName, cleanEmail]
    );

    return inserted[0] as Nutricionista;
  } catch (err) {
    console.warn("getOrCreateNutricionista note:", err);
    return {
      id: userId,
      nome: cleanName,
      email: cleanEmail,
      created_at: new Date().toISOString(),
    };
  }
}

/**
 * Loads the dashboard metrics for the logged-in nutricionista in real time.
 */
export async function fetchDashboardMetrics(
  nutricionistaId: string,
  nutricionistaEmail: string
): Promise<DashboardMetrics> {
  let resolvedId = nutricionistaId;

  try {
    const nut = await sql(
      `SELECT id FROM nutricionistas 
       WHERE id::text = $1 OR LOWER(email) = LOWER($2)
       LIMIT 1`,
      [nutricionistaId, nutricionistaEmail]
    );

    if (nut && nut.length > 0) {
      resolvedId = nut[0].id;
    }
  } catch (e) {
    console.warn("Could not resolve nutricionista ID from database:", e);
  }

  try {
    // 1. Total de pacientes ativos cadastrados pela nutricionista logada
    const pacientesCountRes = await sql(
      `SELECT COUNT(*)::int as count 
       FROM pacientes 
       WHERE nutricionista_id::text = $1`,
      [resolvedId]
    );
    const totalPacientes = Number(pacientesCountRes[0]?.count) || 0;

    // 2. Consultas da semana atual (Segunda a Domingo da semana corrente)
    const consultasSemanaRes = await sql(
      `SELECT COUNT(*)::int as count
       FROM consultas c
       INNER JOIN pacientes p ON p.id = c.paciente_id
       WHERE p.nutricionista_id::text = $1
         AND c.data_consulta >= date_trunc('week', CURRENT_DATE)::date
         AND c.data_consulta <= (date_trunc('week', CURRENT_DATE) + interval '6 days')::date`,
      [resolvedId]
    );
    const consultasSemana = Number(consultasSemanaRes[0]?.count) || 0;

    // 3. Pacientes sem retorno:
    // cuja última consulta foi há mais de 30 dias e que não possuem próximo retorno agendado
    const pacientesSemRetornoRes = await sql(
      `WITH UltimaConsultaPorPaciente AS (
         SELECT 
           c.paciente_id,
           MAX(c.data_consulta) as ultima_data_consulta
         FROM consultas c
         INNER JOIN pacientes p ON p.id = c.paciente_id
         WHERE p.nutricionista_id::text = $1
         GROUP BY c.paciente_id
       ),
       PacientesComRetornoFuturo AS (
         SELECT DISTINCT c.paciente_id
         FROM consultas c
         INNER JOIN pacientes p ON p.id = c.paciente_id
         WHERE p.nutricionista_id::text = $1
           AND (
             (c.proximo_retorno IS NOT NULL AND c.proximo_retorno >= CURRENT_DATE)
             OR (c.data_consulta > CURRENT_DATE)
           )
       )
       SELECT 
         p.id as paciente_id,
         p.nome as paciente_nome,
         p.email as paciente_email,
         p.telefone as paciente_telefone,
         u.ultima_data_consulta::text as ultima_consulta,
         (CURRENT_DATE - u.ultima_data_consulta)::int as dias_desde_ultima_consulta
       FROM UltimaConsultaPorPaciente u
       INNER JOIN pacientes p ON p.id = u.paciente_id
       WHERE u.ultima_data_consulta < (CURRENT_DATE - interval '30 days')::date
         AND p.id NOT IN (SELECT paciente_id FROM PacientesComRetornoFuturo)
       ORDER BY u.ultima_data_consulta ASC`,
      [resolvedId]
    );

    const pacientesSemRetorno: PacienteSemRetorno[] = (pacientesSemRetornoRes || []).map((row: any) => ({
      paciente_id: row.paciente_id,
      paciente_nome: row.paciente_nome,
      paciente_email: row.paciente_email,
      paciente_telefone: row.paciente_telefone,
      ultima_consulta: row.ultima_consulta,
      dias_desde_ultima_consulta: Number(row.dias_desde_ultima_consulta) || 0,
    }));

    return {
      totalPacientes,
      consultasSemana,
      pacientesSemRetorno,
    };
  } catch (err) {
    console.error("Error executing fetchDashboardMetrics:", err);
    return {
      totalPacientes: 0,
      consultasSemana: 0,
      pacientesSemRetorno: [],
    };
  }
}

/**
 * Retorna todos os pacientes cadastrados pela nutricionista logada,
 * incluindo a data da última consulta de cada um.
 */
export async function fetchPacientesComUltimaConsulta(
  nutricionistaId: string,
  nutricionistaEmail: string
): Promise<PacienteListItem[]> {
  let resolvedId = nutricionistaId;

  try {
    const nut = await sql(
      `SELECT id FROM nutricionistas 
       WHERE id::text = $1 OR LOWER(email) = LOWER($2)
       LIMIT 1`,
      [nutricionistaId, nutricionistaEmail]
    );

    if (nut && nut.length > 0) {
      resolvedId = nut[0].id;
    }
  } catch (e) {
    console.warn("Could not resolve nutricionista ID from database:", e);
  }

  try {
    const rows = await sql(
      `SELECT 
         p.id,
         p.nome,
         p.objetivos,
         p.objetivo_texto,
         p.data_nascimento::text as data_nascimento,
         p.whatsapp,
         p.email,
         p.created_at::text as created_at,
         MAX(c.data_consulta)::text as ultima_consulta
       FROM pacientes p
       LEFT JOIN consultas c ON c.paciente_id = p.id
       WHERE p.nutricionista_id::text = $1
       GROUP BY p.id
       ORDER BY p.created_at DESC`,
      [resolvedId]
    );

    return (rows || []).map((row: any) => ({
      id: row.id,
      nome: row.nome,
      objetivos: Array.isArray(row.objetivos) ? row.objetivos : [],
      objetivo_texto: row.objetivo_texto || null,
      data_nascimento: row.data_nascimento || null,
      whatsapp: row.whatsapp || null,
      email: row.email || null,
      ultima_consulta: row.ultima_consulta || null,
      created_at: row.created_at || new Date().toISOString(),
    }));
  } catch (err) {
    console.error("Erro ao listar pacientes:", err);
    throw err;
  }
}

export type CreatePacienteInput = Omit<Paciente, "id" | "created_at">;

/**
 * Cadastra um novo paciente vinculado à nutricionista logada no Neon DB.
 */
export async function createPaciente(
  nutricionistaId: string,
  nutricionistaEmail: string,
  data: Omit<Paciente, "id" | "nutricionista_id" | "created_at">
): Promise<Paciente> {
  let resolvedId = nutricionistaId;

  try {
    const nut = await sql(
      `SELECT id FROM nutricionistas 
       WHERE id::text = $1 OR LOWER(email) = LOWER($2)
       LIMIT 1`,
      [nutricionistaId, nutricionistaEmail]
    );

    if (nut && nut.length > 0) {
      resolvedId = nut[0].id;
    }
  } catch (e) {
    console.warn("Could not resolve nutricionista ID from database:", e);
  }

  const rows = await sql(
    `INSERT INTO pacientes (
      nutricionista_id,
      nome,
      data_nascimento,
      sexo,
      whatsapp,
      email,
      peso_inicial,
      altura,
      objetivos,
      objetivo_texto,
      nivel_atividade,
      patologias,
      restricoes_alimentares,
      alergias,
      medicamentos,
      suplementos,
      refeicoes_por_dia,
      horario_acorda,
      horario_dorme,
      litros_agua,
      atividade_fisica,
      atividade_fisica_descricao,
      observacoes
    ) VALUES (
      $1::uuid,
      $2,
      $3,
      $4,
      $5,
      $6,
      $7,
      $8,
      $9,
      $10,
      $11,
      $12,
      $13,
      $14,
      $15,
      $16,
      $17,
      $18,
      $19,
      $20,
      $21,
      $22,
      $23
    ) RETURNING *`,
    [
      resolvedId,
      data.nome.trim(),
      data.data_nascimento || null,
      data.sexo || null,
      data.whatsapp || null,
      data.email || null,
      data.peso_inicial != null && !isNaN(Number(data.peso_inicial)) ? Number(data.peso_inicial) : null,
      data.altura != null && !isNaN(Number(data.altura)) ? Number(data.altura) : null,
      data.objetivos && data.objetivos.length > 0 ? data.objetivos : null,
      data.objetivo_texto || null,
      data.nivel_atividade || null,
      data.patologias && data.patologias.length > 0 ? data.patologias : null,
      data.restricoes_alimentares && data.restricoes_alimentares.length > 0 ? data.restricoes_alimentares : null,
      data.alergias && data.alergias.length > 0 ? data.alergias : null,
      data.medicamentos || null,
      data.suplementos || null,
      data.refeicoes_por_dia != null && !isNaN(Number(data.refeicoes_por_dia)) ? Number(data.refeicoes_por_dia) : null,
      data.horario_acorda || null,
      data.horario_dorme || null,
      data.litros_agua != null && !isNaN(Number(data.litros_agua)) ? Number(data.litros_agua) : null,
      typeof data.atividade_fisica === "boolean" ? data.atividade_fisica : false,
      data.atividade_fisica_descricao || null,
      data.observacoes || null,
    ]
  );

  return rows[0] as Paciente;
}

export interface PlanoAlimentar {
  id: string;
  paciente_id: string;
  conteudo: any;
  created_at: string;
}

/**
 * Busca os dados completos de um paciente por ID.
 */
export async function fetchPacientePorId(pacienteId: string): Promise<Paciente | null> {
  const rows = await sql`SELECT * FROM pacientes WHERE id = ${pacienteId}::uuid LIMIT 1`;
  if (!rows || rows.length === 0) return null;
  return rows[0] as Paciente;
}

/**
 * Atualiza todos os dados editáveis do paciente no Neon DB.
 */
export async function updatePaciente(
  pacienteId: string,
  data: Partial<Omit<Paciente, "id" | "nutricionista_id" | "created_at">>
): Promise<Paciente> {
  const rows = await sql`
    UPDATE pacientes SET
      nome = COALESCE(${data.nome?.trim() ?? null}, nome),
      data_nascimento = ${data.data_nascimento || null},
      sexo = ${data.sexo || null},
      whatsapp = ${data.whatsapp || null},
      email = ${data.email || null},
      peso_inicial = ${data.peso_inicial != null && !isNaN(Number(data.peso_inicial)) ? Number(data.peso_inicial) : null},
      altura = ${data.altura != null && !isNaN(Number(data.altura)) ? Number(data.altura) : null},
      objetivos = ${data.objetivos && data.objetivos.length > 0 ? data.objetivos : null},
      objetivo_texto = ${data.objetivo_texto || null},
      nivel_atividade = ${data.nivel_atividade || null},
      patologias = ${data.patologias && data.patologias.length > 0 ? data.patologias : null},
      restricoes_alimentares = ${data.restricoes_alimentares && data.restricoes_alimentares.length > 0 ? data.restricoes_alimentares : null},
      alergias = ${data.alergias && data.alergias.length > 0 ? data.alergias : null},
      medicamentos = ${data.medicamentos || null},
      suplementos = ${data.suplementos || null},
      refeicoes_por_dia = ${data.refeicoes_por_dia != null && !isNaN(Number(data.refeicoes_por_dia)) ? Number(data.refeicoes_por_dia) : null},
      horario_acorda = ${data.horario_acorda || null},
      horario_dorme = ${data.horario_dorme || null},
      litros_agua = ${data.litros_agua != null && !isNaN(Number(data.litros_agua)) ? Number(data.litros_agua) : null},
      atividade_fisica = ${typeof data.atividade_fisica === "boolean" ? data.atividade_fisica : false},
      atividade_fisica_descricao = ${data.atividade_fisica_descricao || null},
      observacoes = ${data.observacoes || null}
    WHERE id = ${pacienteId}::uuid
    RETURNING *
  `;
  return rows[0] as Paciente;
}

/**
 * Busca todas as consultas de um paciente em ordem cronológica decrescente.
 */
export async function fetchConsultasPorPaciente(pacienteId: string): Promise<Consulta[]> {
  const rows = await sql`
    SELECT 
      id,
      paciente_id,
      data_consulta::text as data_consulta,
      peso,
      cintura,
      quadril,
      percentual_gordura,
      observacoes,
      proximo_retorno::text as proximo_retorno,
      created_at::text as created_at
    FROM consultas
    WHERE paciente_id = ${pacienteId}::uuid
    ORDER BY data_consulta DESC, created_at DESC
  `;

  return (rows || []).map((row: any) => ({
    id: row.id,
    paciente_id: row.paciente_id,
    data_consulta: row.data_consulta,
    peso: row.peso != null ? Number(row.peso) : null,
    cintura: row.cintura != null ? Number(row.cintura) : null,
    quadril: row.quadril != null ? Number(row.quadril) : null,
    percentual_gordura: row.percentual_gordura != null ? Number(row.percentual_gordura) : null,
    observacoes: row.observacoes || null,
    proximo_retorno: row.proximo_retorno || null,
    created_at: row.created_at || new Date().toISOString(),
  }));
}

export interface CreateConsultaInput {
  paciente_id: string;
  data_consulta: string;
  peso: number;
  cintura?: number | null;
  quadril?: number | null;
  percentual_gordura?: number | null;
  observacoes?: string | null;
  proximo_retorno?: string | null;
}

/**
 * Cria uma nova consulta no Neon DB para o paciente.
 */
export async function createConsulta(data: CreateConsultaInput): Promise<Consulta> {
  const rows = await sql`
    INSERT INTO consultas (
      paciente_id,
      data_consulta,
      peso,
      cintura,
      quadril,
      percentual_gordura,
      observacoes,
      proximo_retorno
    ) VALUES (
      ${data.paciente_id}::uuid,
      ${data.data_consulta}::date,
      ${data.peso},
      ${data.cintura != null && !isNaN(Number(data.cintura)) ? Number(data.cintura) : null},
      ${data.quadril != null && !isNaN(Number(data.quadril)) ? Number(data.quadril) : null},
      ${data.percentual_gordura != null && !isNaN(Number(data.percentual_gordura)) ? Number(data.percentual_gordura) : null},
      ${data.observacoes?.trim() || null},
      ${data.proximo_retorno ? data.proximo_retorno : null}
    ) RETURNING 
      id,
      paciente_id,
      data_consulta::text as data_consulta,
      peso,
      cintura,
      quadril,
      percentual_gordura,
      observacoes,
      proximo_retorno::text as proximo_retorno,
      created_at::text as created_at
  `;

  const row = rows[0];
  return {
    id: row.id,
    paciente_id: row.paciente_id,
    data_consulta: row.data_consulta,
    peso: row.peso != null ? Number(row.peso) : null,
    cintura: row.cintura != null ? Number(row.cintura) : null,
    quadril: row.quadril != null ? Number(row.quadril) : null,
    percentual_gordura: row.percentual_gordura != null ? Number(row.percentual_gordura) : null,
    observacoes: row.observacoes || null,
    proximo_retorno: row.proximo_retorno || null,
    created_at: row.created_at,
  };
}

/**
 * Busca histórico de planos alimentares de um paciente em ordem cronológica decrescente.
 */
export async function fetchPlanosPorPaciente(pacienteId: string): Promise<PlanoAlimentar[]> {
  const rows = await sql`
    SELECT 
      id,
      paciente_id,
      conteudo,
      created_at::text as created_at
    FROM planos_alimentares
    WHERE paciente_id = ${pacienteId}::uuid
    ORDER BY created_at DESC
  `;

  return (rows || []).map((row: any) => ({
    id: row.id,
    paciente_id: row.paciente_id,
    conteudo: row.conteudo,
    created_at: row.created_at,
  }));
}


