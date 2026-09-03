export const pgQueries = {
  // =============================
  // LISTAR UTEs
  // =============================
  selectUtes: `
    SELECT 
      ute,
      COUNT(DISTINCT linha) AS count,
      'linhas' AS count_type
    FROM manusis.vw_machineledger
    GROUP BY ute
    ORDER BY ute;
  `,

  // =============================
  // LISTAR LINHAS
  // =============================
  selectLinhas: `
    SELECT 
      linha,
      COUNT(DISTINCT maquina) AS count,
      'maquinas' AS count_type
    FROM manusis.vw_machineledger
    WHERE ute = $1
    GROUP BY linha
    ORDER BY linha;
  `,

  // =============================
  // LISTAR OPERAÇÕES
  // =============================
  selectOperacoes: `
    SELECT 
      operacao,
      COUNT(DISTINCT maquina) AS count,
      'maquinas' AS count_type
    FROM manusis.vw_machineledger
    WHERE linha = $1
    GROUP BY operacao
    ORDER BY operacao;
  `,

  // =============================
  // LISTAR TIPOS DE MÁQUINA
  // =============================
  selectTipos: `
    SELECT 
      tipo_maquina,
      cod_tipo_maquina,
      COUNT(DISTINCT maquina) AS count,
      COUNT(*) AS sub_count,
      'maquinas' AS count_type,
      'componentes' AS sub_count_type
    FROM manusis.vw_machineledger
    WHERE linha = $1
      AND operacao = $2
    GROUP BY tipo_maquina, cod_tipo_maquina
    ORDER BY tipo_maquina;
  `,

  // =============================
  // LISTAR MÁQUINAS
  // =============================
  selectMaquinas: `
    SELECT 
      maquina,
      cod_tipo_maquina,
      COUNT(*) AS count,
      'componentes' AS count_type
    FROM manusis.vw_machineledger
    WHERE linha = $1
      AND operacao = $2
      AND tipo_maquina = $3
    GROUP BY maquina, cod_tipo_maquina
    ORDER BY maquina;
  `,

  // =============================
  // LISTAR COMPONENTES
  // =============================
  selectComponentes: `
    SELECT 
      id,
      ute,
      linha,
      operacao,
      tipo_maquina,
      cod_tipo_maquina,
      m_maquina,
      maquina,
      descricao_componente,
      caracteristicas_tecnicas,
      fabricante,
      codigo_comercial,
      codigo_sap,
      codigo_dotacao,
      id_loc,
      tecnologia,
      data_criacao
    FROM manusis.vw_machineledger
    WHERE maquina = $1 AND codigo_dotacao <> ''
    ORDER BY descricao_componente;
  `,

  // =============================
  // SEARCH GLOBAL
  // =============================
  searchMachineLedger: `
    SELECT *
    FROM manusis.vw_machineledger
    WHERE maquina ILIKE '%' || $1 || '%'
       OR descricao_componente ILIKE '%' || $1 || '%'
       OR caracteristicas_tecnicas ILIKE '%' || $1 || '%'
       OR codigo_sap ILIKE '%' || $1 || '%'
       OR codigo_comercial ILIKE '%' || $1 || '%'
    LIMIT 100;
  `,
};
