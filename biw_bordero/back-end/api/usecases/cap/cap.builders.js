// =============================
// BUILDERS - PRODUÇÃO
// =============================

export function buildProducaoChart(dados) {
  const hours = buildHours(dados);
  const categorias = buildCategorias(dados);
  const dataMap = buildDataMap(dados);

  const ts = buildTsList(hours, dados);

  // console.log("TS:", ts);
  return {
    hours: hours.map((h) => h.intervalo),
    chartSeries: buildChartSeries(hours, categorias, dataMap),
    turnos: buildTurnosList(hours, dados), // Passa hours como referência
    ts: buildTsList(hours, dados), // Passa hours como referência
  };
}

export function buildHours(dados) {
  return [
    ...new Map(
      dados.map((d) => [
        `${d.intervalo}|${d.ts_inicio}`,
        { intervalo: d.intervalo, ts_inicio: d.ts_inicio },
      ]),
    ).values(),
  ];
}

export function buildTurnosList(hours, dados) {
  // Cria um mapa para buscar o turno de cada hora única
  const turnoMap = new Map();

  for (const item of dados) {
    const key = `${item.intervalo}|${item.ts_inicio.toISOString()}`;
    if (!turnoMap.has(key)) {
      turnoMap.set(key, item.turno);
    }
  }

  // Retorna os turnos na mesma ordem que hours
  return hours.map((hora) => {
    const key = `${hora.intervalo}|${hora.ts_inicio.toISOString()}`;
    return turnoMap.get(key);
  });
}

export function buildTsList(hours, dados) {
  // Cria um mapa para buscar o ts de cada hora única
  const tsMap = new Map();

  for (const item of dados) {
    const key = `${item.intervalo}|${item.ts_inicio.toISOString()}`;
    if (!tsMap.has(key)) {
      tsMap.set(key, [item.ts_inicio, item.ts_fim]);
    }
  }

  // Retorna os ts na mesma ordem que hours
  return hours.map((hora) => {
    const key = `${hora.intervalo}|${hora.ts_inicio.toISOString()}`;
    return tsMap.get(key);
  });
}

export function buildCategorias(dados) {
  const categorias = [...new Set(dados.map((d) => d.reasondesc))];

  return categorias.sort((a, b) => {
    if (a === "REALIZADO") return -1;
    if (b === "REALIZADO") return 1;
    if (a === "NÃO JUSTIFICADO") return 1;
    if (b === "NÃO JUSTIFICADO") return -1;
    return 0;
  });
}

export function buildDataMap(dados) {
  return new Map(
    dados.map((d) => [
      `${d.intervalo}|${d.ts_inicio.toISOString()}|${d.reasondesc}`,
      d.valor,
    ]),
  );
}

export function buildChartSeries(hours, categorias, dataMap) {
  return categorias.map((cat) => ({
    name: cat,
    data: hours.map((hora) => {
      const key = `${hora.intervalo}|${hora.ts_inicio.toISOString()}|${cat}`;
      return dataMap.get(key) ?? 0;
    }),
  }));
}

// =============================
// BUILDERS - LISTAR JUSTIFICATIVAS
// =============================
export function buildJustificativasList(rows) {
  //   console.log("Rows recebidas do banco:", rows);
  return rows.map((row) => ({
    id: row.id_justificativa,

    linha: row.linha,
    maquina: row.maquina,
    ts_inicio: row.ts_inicio,
    data: row.data,
    turno: row.turno,
    hora: row.horaselecionada,

    descricao: row.descricao,
    duracao: row.duracao_total,

    causaRaiz: row.causa_raiz,
    responsavel: row.responsavel,
    validador: row.validador,
    comentario: row.comentario,

    status: {
      nome: row.status,
      texto: row.textstatus,
    },

    alarms: row.alarmsid ?? [],
    criadoEm: row.created_at,
  }));
}

// =============================
// BUILDERS - JUSTIFICATIVA BY ID
// =============================
export function buildJustificativa(rows, relacoesRows = [], idBase) {
  if (!rows.length) return null;

  const base = rows[0];
  const baseId = Number(idBase || base.id_justificativa);

  const justificativaBase = {
    id: base.id_justificativa,

    linha: base.linha,
    maquina: base.maquina,
    data: base.data,
    hora: base.horaselecionada,
    componente: base.componente,
    modoFalha: base.descricao,
    duracao: base.dur_min,
    interventor: base.interventor,

    status: {
      id: base.idstatus,
      nome: base.status,
      texto: base.textstatus,
    },

    validador: base.validador,
    responsavel: base.responsavel,

    historico: rows.map((row) => ({
      descricao: row.descricao,
      causaRaiz: row.causa_raiz,
      maquina: row.maquina,
      componente: row.componente,
      comentario: row.comentario,
      criadoEm: row.created_at,
      criador: {
        nome: row.criador_nome,
        area: row.criador_area,
        matricula: row.matricula,
      },
      responsavel: row.responsavel,
    })),
  };

  // =========================
  // 🧠 GRAFO
  // =========================

  const nodesMap = new Map();

  // 🔹 adiciona base
  nodesMap.set(baseId, {
    id: baseId,
    linha: base.linha,
    maquina: base.maquina,
    causaRaiz: base.causa_raiz,
    duracao: base.dur_min,
    tipo: "BASE",
  });

  // 🔹 adiciona nós das relações
  relacoesRows.forEach((row) => {
    const id = Number(row.id_justificativa);

    if (!nodesMap.has(id)) {
      nodesMap.set(id, {
        id,
        linha: row.linha,
        maquina: row.maquina,
        causaRaiz: row.causa_raiz,
        componente: row.componente,
        modoFalha: row.descricao,
        duracao: row.dur_min,

        status: {
          id: row.idstatus,
          nome: row.status,
          texto: row.textstatus,
        },

        validador: row.validador,
        responsavel: row.responsavel,
        interventor: row.interventor,
      });
    }
  });
  // 🔹 edges (ligações)
  const edges = relacoesRows.map((row) => ({
    from: Number(row.pai_id),
    to: Number(row.id_justificativa),
    direcao: row.direcao,
    tempo_alocado: row.tempo_alocado,
    duracao: row.dur_min,
    nivel: row.nivel,
  }));

  return {
    ...justificativaBase,
    grafo: {
      nodes: Array.from(nodesMap.values()),
      edges,
    },
  };
}

// BUILDERS - PENDÊNCIAS DE VALIDACAO
// =============================
export function buildValidacaoPendencias(justificativas, responsaveisDim) {
  const resultado = {};

  // Mapa para lookup rápido (performance)
  const responsaveisMap = new Map(
    responsaveisDim.map((r) => [r.responsavel, r.responsavel]),
  );

  // Estrutura inicial
  responsaveisDim.forEach((r) => {
    resultado[r.responsavel] = {
      items: [[], []],
      resumo: [
        { quantidade: 0, perdas: 0 }, // não finalizadas
        { quantidade: 0, perdas: 0 }, // finalizadas
      ],
    };
  });

  justificativas.forEach((j) => {
    const validador = j.validador || "Sem Validador";

    const responsavelKey = responsaveisMap.get(validador) || validador;

    if (!resultado[responsavelKey]) {
      resultado[responsavelKey] = {
        items: [[], []],
        resumo: [
          { quantidade: 0, perdas: 0 },
          { quantidade: 0, perdas: 0 },
        ],
      };
    }

    const isFinalizada = j.status === "Finalizada";
    const index = isFinalizada ? 1 : 0;

    resultado[responsavelKey].items[index].push({
      id_justificativa: j.id_justificativa,
      linha: j.linha,
      maquina: j.maquina,
      duracao_total: j.duracao_total,
      responsavel: j.responsavel,
      status: j.status,
      textstatus: j.textstatus,
    });

    resultado[responsavelKey].resumo[index].quantidade += 1;
    resultado[responsavelKey].resumo[index].perdas += parseFloat(
      j.duracao_total || 0,
    );
  });

  return resultado;
}

// =============================
// BUILDERS - ALARMES DISPONÍVEIS PARA ALOCAÇÃO
// =============================

export function buildAlarmesDisponiveis(dados) {
  const normalized = dados.map(normalizeItem);

  return {
    alarmes: normalized,
    linhas: buildLinhas(normalized),
    horas: buildHoras(normalized),
  };
}

function normalizeItem(d) {
  return {
    id: d.id,
    linha: d.linha,
    hora: d.hora,
    data: d.data,
    ts_inicio: d.ts_inicio,
    maquina: d.maquina,
    causa_raiz: d.causa_raiz,
    componente: d.componente,
    modo_falha: d.modo_falha,

    duracao: parseFloat(d.dur_min),
    tempo_alocado: parseFloat(d.tempo_alocado),
    tempo_disponivel: parseFloat(d.tempo_disponivel),

    status: {
      nome: d.status,
      texto: d.status_nome,
    },
  };
}

function buildLinhas(dados) {
  return [...new Set(dados.map((d) => d.linha))];
}

function buildHoras(dados) {
  const uniqueMap = new Map();

  for (const item of dados) {
    const key = item.hora;

    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, {
        hora: item.hora,
        ts_inicio: new Date(item.ts_inicio),
      });
    }
  }

  return [...uniqueMap.values()]
    .sort((a, b) => a.ts_inicio - b.ts_inicio)
    .map((h) => h.hora);
}
