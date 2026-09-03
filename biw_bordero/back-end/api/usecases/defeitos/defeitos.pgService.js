// controllers/defeitos.controller.js
import { pool } from "../../postgreConnect.js";

// =============================
// CRIAR DEFEITO
// =============================
export async function criarDefeito(req, res) {
  try {
    // Pega a matrícula do usuário autenticado
    const matricula = req.user?.matricula || req.user?.sub;

    if (!matricula) {
      return res.status(401).json({
        error: "Usuário não autenticado ou matrícula não encontrada",
      });
    }

    const {
      data,
      turno,
      modelo,
      visao,
      area,
      numeroQuadrante,
      quadranteId,
      defeito,
      observacoes,
      registradoEm,
    } = req.body;

    // Validações
    if (!data) {
      return res.status(400).json({ error: "Data é obrigatória" });
    }
    if (!turno || ![1, 2, 3].includes(Number(turno))) {
      return res.status(400).json({ error: "Turno inválido (1, 2 ou 3)" });
    }
    if (!modelo) {
      return res.status(400).json({ error: "Modelo é obrigatório" });
    }
    if (!visao) {
      return res.status(400).json({ error: "Visão é obrigatória" });
    }
    if (!area) {
      return res.status(400).json({ error: "Área é obrigatória" });
    }
    if (!numeroQuadrante) {
      return res
        .status(400)
        .json({ error: "Número do quadrante é obrigatório" });
    }
    if (!defeito || defeito.trim() === "") {
      return res.status(400).json({ error: "Defeito é obrigatório" });
    }

    // Verifica se o usuário existe
    const userCheck = await pool.query(
      "SELECT matricula, nome FROM auth.usuarios WHERE matricula = $1",
      [matricula],
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    // Insere o defeito
    const result = await pool.query(
      `INSERT INTO defeitos.historico (
        data,
        turno,
        modelo,
        visao,
        area,
        numero_quadrante,
        quadrante_id,
        defeito,
        observacoes,
        matricula,
        registrado_em
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        data,
        Number(turno),
        modelo,
        visao,
        area,
        Number(numeroQuadrante),
        quadranteId || null,
        defeito.trim(),
        observacoes || null,
        matricula,
        registradoEm || new Date().toISOString(),
      ],
    );

    const novoDefeito = result.rows[0];
    const usuario = userCheck.rows[0];

    return res.status(201).json({
      success: true,
      message: "Defeito registrado com sucesso!",
      data: {
        ...novoDefeito,
        usuario_nome: usuario.nome,
      },
    });
  } catch (error) {
    console.error("❌ Erro ao criar defeito:", error);

    if (error.code === "23503") {
      return res.status(400).json({
        error: "Matrícula do usuário inválida",
      });
    }

    return res.status(500).json({
      error: "Erro interno ao registrar defeito",
      details: error.message,
    });
  }
}

// =============================
// LISTAR DEFEITOS COM FILTROS
// =============================
export async function listarDefeitos(req, res) {
  try {
    const {
      data,
      turno,
      modelo,
      visao,
      area,
      quadrante,
      defeito,
      dataInicio,
      dataFim,
      limit = 100,
      offset = 0,
    } = req.query;

    let query = `
      SELECT 
        dh.*,
        u.nome as usuario_nome,
        u.email as usuario_email
      FROM defeitos.historico dh
      LEFT JOIN auth.usuarios u ON dh.matricula = u.matricula
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    // Filtros
    if (data) {
      query += ` AND dh.data = $${paramIndex}`;
      params.push(data);
      paramIndex++;
    }

    if (turno) {
      query += ` AND dh.turno = $${paramIndex}`;
      params.push(Number(turno));
      paramIndex++;
    }

    if (modelo) {
      query += ` AND dh.modelo = $${paramIndex}`;
      params.push(modelo);
      paramIndex++;
    }

    if (visao) {
      query += ` AND dh.visao = $${paramIndex}`;
      params.push(visao);
      paramIndex++;
    }

    if (area) {
      query += ` AND dh.area = $${paramIndex}`;
      params.push(area);
      paramIndex++;
    }

    if (quadrante) {
      query += ` AND dh.numero_quadrante = $${paramIndex}`;
      params.push(Number(quadrante));
      paramIndex++;
    }

    if (defeito) {
      query += ` AND dh.defeito ILIKE $${paramIndex}`;
      params.push(`%${defeito}%`);
      paramIndex++;
    }

    if (dataInicio) {
      query += ` AND dh.data >= $${paramIndex}`;
      params.push(dataInicio);
      paramIndex++;
    }

    if (dataFim) {
      query += ` AND dh.data <= $${paramIndex}`;
      params.push(dataFim);
      paramIndex++;
    }

    query += ` ORDER BY dh.registrado_em DESC`;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(Number(limit), Number(offset));

    const { rows } = await pool.query(query, params);

    // Conta total
    let countQuery = `SELECT COUNT(*) as total FROM defeitos.historico dh WHERE 1=1`;
    const countParams = [];
    let countIndex = 1;

    if (data) {
      countQuery += ` AND dh.data = $${countIndex}`;
      countParams.push(data);
      countIndex++;
    }
    if (turno) {
      countQuery += ` AND dh.turno = $${countIndex}`;
      countParams.push(Number(turno));
      countIndex++;
    }
    if (modelo) {
      countQuery += ` AND dh.modelo = $${countIndex}`;
      countParams.push(modelo);
      countIndex++;
    }
    if (visao) {
      countQuery += ` AND dh.visao = $${countIndex}`;
      countParams.push(visao);
      countIndex++;
    }
    if (area) {
      countQuery += ` AND dh.area = $${countIndex}`;
      countParams.push(area);
      countIndex++;
    }
    if (quadrante) {
      countQuery += ` AND dh.numero_quadrante = $${countIndex}`;
      countParams.push(Number(quadrante));
      countIndex++;
    }
    if (defeito) {
      countQuery += ` AND dh.defeito ILIKE $${countIndex}`;
      countParams.push(`%${defeito}%`);
      countIndex++;
    }
    if (dataInicio) {
      countQuery += ` AND dh.data >= $${countIndex}`;
      countParams.push(dataInicio);
      countIndex++;
    }
    if (dataFim) {
      countQuery += ` AND dh.data <= $${countIndex}`;
      countParams.push(dataFim);
      countIndex++;
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0]?.total || 0);

    return res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        total,
        limit: Number(limit),
        offset: Number(offset),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("❌ Erro ao listar defeitos:", error);
    return res.status(500).json({
      error: "Erro interno ao listar defeitos",
      details: error.message,
    });
  }
}

// =============================
// BUSCAR DEFEITO POR ID
// =============================
export async function buscarDefeitoPorId(req, res) {
  try {
    const { id } = req.params;

    const { rows } = await pool.query(
      `SELECT 
        dh.*,
        u.nome as usuario_nome,
        u.email as usuario_email
      FROM defeitos.historico dh
      LEFT JOIN auth.usuarios u ON dh.matricula = u.matricula
      WHERE dh.id = $1`,
      [id],
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Defeito não encontrado" });
    }

    return res.status(200).json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    console.error("❌ Erro ao buscar defeito:", error);
    return res.status(500).json({
      error: "Erro interno ao buscar defeito",
      details: error.message,
    });
  }
}

// =============================
// ATUALIZAR DEFEITO
// =============================
export async function atualizarDefeito(req, res) {
  try {
    const { id } = req.params;
    const {
      data,
      turno,
      modelo,
      visao,
      area,
      numeroQuadrante,
      quadranteId,
      defeito,
      observacoes,
    } = req.body;

    const checkResult = await pool.query(
      "SELECT id FROM defeitos.historico WHERE id = $1",
      [id],
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: "Defeito não encontrado" });
    }

    const { rows } = await pool.query(
      `UPDATE defeitos.historico SET
        data = COALESCE($1, data),
        turno = COALESCE($2, turno),
        modelo = COALESCE($3, modelo),
        visao = COALESCE($4, visao),
        area = COALESCE($5, area),
        numero_quadrante = COALESCE($6, numero_quadrante),
        quadrante_id = COALESCE($7, quadrante_id),
        defeito = COALESCE($8, defeito),
        observacoes = COALESCE($9, observacoes)
      WHERE id = $10
      RETURNING *`,
      [
        data || null,
        turno ? Number(turno) : null,
        modelo || null,
        visao || null,
        area || null,
        numeroQuadrante ? Number(numeroQuadrante) : null,
        quadranteId || null,
        defeito || null,
        observacoes || null,
        id,
      ],
    );

    return res.status(200).json({
      success: true,
      message: "Defeito atualizado com sucesso!",
      data: rows[0],
    });
  } catch (error) {
    console.error("❌ Erro ao atualizar defeito:", error);
    return res.status(500).json({
      error: "Erro interno ao atualizar defeito",
      details: error.message,
    });
  }
}

// =============================
// DELETAR DEFEITO
// =============================
export async function deletarDefeito(req, res) {
  try {
    const { id } = req.params;

    const { rows } = await pool.query(
      "DELETE FROM defeitos.historico WHERE id = $1 RETURNING id",
      [id],
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Defeito não encontrado" });
    }

    return res.status(200).json({
      success: true,
      message: "Defeito removido com sucesso!",
    });
  } catch (error) {
    console.error("❌ Erro ao deletar defeito:", error);
    return res.status(500).json({
      error: "Erro interno ao deletar defeito",
      details: error.message,
    });
  }
}

// =============================
// ESTATÍSTICAS DE DEFEITOS
// =============================
export async function estatisticasDefeitos(req, res) {
  try {
    const { dataInicio, dataFim, modelo } = req.query;

    let query = `
      SELECT 
        COUNT(*) as total_defeitos,
        COUNT(DISTINCT matricula) as total_usuarios,
        COUNT(DISTINCT data) as dias_com_registro,
        COUNT(DISTINCT modelo) as modelos_afetados,
        ROUND(AVG(numero_quadrante), 2) as media_quadrante
      FROM defeitos.historico
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (dataInicio) {
      query += ` AND data >= $${paramIndex}`;
      params.push(dataInicio);
      paramIndex++;
    }

    if (dataFim) {
      query += ` AND data <= $${paramIndex}`;
      params.push(dataFim);
      paramIndex++;
    }

    if (modelo) {
      query += ` AND modelo = $${paramIndex}`;
      params.push(modelo);
      paramIndex++;
    }

    const resumoResult = await pool.query(query, params);

    // Top defeitos
    const topDefeitosQuery = `
      SELECT 
        defeito,
        COUNT(*) as ocorrencias
      FROM defeitos.historico
      WHERE 1=1
      ${modelo ? `AND modelo = $1` : ""}
      GROUP BY defeito
      ORDER BY ocorrencias DESC
      LIMIT 10
    `;
    const topParams = modelo ? [modelo] : [];
    const topResult = await pool.query(topDefeitosQuery, topParams);

    // Defeitos por modelo
    const porModeloResult = await pool.query(
      `SELECT 
        modelo,
        COUNT(*) as total
      FROM defeitos.historico
      GROUP BY modelo
      ORDER BY total DESC`,
    );

    // Defeitos por visão
    const porVisaoResult = await pool.query(
      `SELECT 
        visao,
        COUNT(*) as total
      FROM defeitos.historico
      GROUP BY visao
      ORDER BY total DESC`,
    );

    return res.status(200).json({
      success: true,
      data: {
        resumo: resumoResult.rows[0] || {
          total_defeitos: 0,
          total_usuarios: 0,
          dias_com_registro: 0,
          modelos_afetados: 0,
          media_quadrante: 0,
        },
        topDefeitos: topResult.rows,
        porModelo: porModeloResult.rows,
        porVisao: porVisaoResult.rows,
      },
    });
  } catch (error) {
    console.error("❌ Erro ao buscar estatísticas:", error);
    return res.status(500).json({
      error: "Erro interno ao buscar estatísticas",
      details: error.message,
    });
  }
}

// =============================
// DEFEITOS POR MODELO
// =============================
export async function defeitosPorModelo(req, res) {
  try {
    const { modelo } = req.params;
    const { dataInicio, dataFim } = req.query;

    let query = `
      SELECT 
        dh.*,
        u.nome as usuario_nome
      FROM defeitos.historico dh
      LEFT JOIN auth.usuarios u ON dh.matricula = u.matricula
      WHERE dh.modelo = $1
    `;

    const params = [modelo];
    let paramIndex = 2;

    if (dataInicio) {
      query += ` AND dh.data >= $${paramIndex}`;
      params.push(dataInicio);
      paramIndex++;
    }

    if (dataFim) {
      query += ` AND dh.data <= $${paramIndex}`;
      params.push(dataFim);
      paramIndex++;
    }

    query += ` ORDER BY dh.registrado_em DESC`;

    const { rows } = await pool.query(query, params);

    return res.status(200).json({
      success: true,
      data: rows,
      total: rows.length,
    });
  } catch (error) {
    console.error("❌ Erro ao buscar defeitos por modelo:", error);
    return res.status(500).json({
      error: "Erro interno ao buscar defeitos por modelo",
      details: error.message,
    });
  }
}

// =============================
// DEFEITOS POR QUADRANTE
// =============================
export async function defeitosPorQuadrante(req, res) {
  try {
    const { visao, quadrante } = req.params;
    const { dataInicio, dataFim } = req.query;

    let query = `
      SELECT 
        dh.*,
        u.nome as usuario_nome
      FROM defeitos.historico dh
      LEFT JOIN auth.usuarios u ON dh.matricula = u.matricula
      WHERE dh.visao = $1 AND dh.numero_quadrante = $2
    `;

    const params = [visao, Number(quadrante)];
    let paramIndex = 3;

    if (dataInicio) {
      query += ` AND dh.data >= $${paramIndex}`;
      params.push(dataInicio);
      paramIndex++;
    }

    if (dataFim) {
      query += ` AND dh.data <= $${paramIndex}`;
      params.push(dataFim);
      paramIndex++;
    }

    query += ` ORDER BY dh.registrado_em DESC`;

    const { rows } = await pool.query(query, params);

    return res.status(200).json({
      success: true,
      data: rows,
      total: rows.length,
    });
  } catch (error) {
    console.error("❌ Erro ao buscar defeitos por quadrante:", error);
    return res.status(500).json({
      error: "Erro interno ao buscar defeitos por quadrante",
      details: error.message,
    });
  }
}

// =============================
// DASHBOARD DE DEFEITOS
// =============================
export async function dashboardDefeitos(req, res) {
  try {
    const { periodo = "hoje", modelo = null } = req.query;

    let dataInicio, dataFim;

    switch (periodo) {
      case "hoje":
        dataInicio = new Date().toISOString().split("T")[0];
        dataFim = dataInicio;
        break;
      case "semana":
        dataInicio = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0];
        dataFim = new Date().toISOString().split("T")[0];
        break;
      case "mes":
        dataInicio = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0];
        dataFim = new Date().toISOString().split("T")[0];
        break;
      default:
        dataInicio = new Date().toISOString().split("T")[0];
        dataFim = dataInicio;
    }

    let query = `
      SELECT 
        COUNT(*) as total,
        COUNT(DISTINCT matricula) as usuarios_ativos,
        COUNT(DISTINCT modelo) as modelos_afetados,
        COUNT(DISTINCT data) as dias_com_registro,
        COUNT(DISTINCT visao) as visoes_afetadas
      FROM defeitos.historico
      WHERE data BETWEEN $1 AND $2
      ${modelo ? `AND modelo = $3` : ""}
    `;

    const params = modelo
      ? [dataInicio, dataFim, modelo]
      : [dataInicio, dataFim];
    const { rows } = await pool.query(query, params);

    // Top defeitos do período
    const topQuery = `
      SELECT 
        defeito,
        COUNT(*) as ocorrencias
      FROM defeitos.historico
      WHERE data BETWEEN $1 AND $2
      ${modelo ? `AND modelo = $3` : ""}
      GROUP BY defeito
      ORDER BY ocorrencias DESC
      LIMIT 5
    `;
    const topParams = modelo
      ? [dataInicio, dataFim, modelo]
      : [dataInicio, dataFim];
    const topResult = await pool.query(topQuery, topParams);

    // Defeitos por dia
    const diaQuery = `
      SELECT 
        data,
        COUNT(*) as total
      FROM defeitos.historico
      WHERE data BETWEEN $1 AND $2
      ${modelo ? `AND modelo = $3` : ""}
      GROUP BY data
      ORDER BY data
    `;
    const diaResult = await pool.query(diaQuery, topParams);

    return res.status(200).json({
      success: true,
      data: {
        resumo: rows[0] || {},
        topDefeitos: topResult.rows,
        porDia: diaResult.rows,
      },
    });
  } catch (error) {
    console.error("❌ Erro ao buscar dashboard:", error);
    return res.status(500).json({
      error: "Erro interno ao buscar dashboard",
      details: error.message,
    });
  }
}
