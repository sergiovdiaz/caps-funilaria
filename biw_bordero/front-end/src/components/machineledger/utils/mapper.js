/**
 * machineledger.mappers.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Converte os payloads brutos da API para os modelos de domínio internos.
 *
 * Regra: nenhum outro arquivo do frontend conhece a estrutura da API.
 *        Tudo passa por aqui.
 *
 * Modelos de domínio (shapes que o resto do frontend consome):
 *
 *   Ute          { id, label, count, countType }
 *   Linha        { id, label, count, countType }
 *   Operacao     { id, label, count, countType }
 *   TipoMaquina  { id, label, codTipoMaquina, count, countType, subCount, subCountType }
 *   Maquina      { id, label, count, countType }
 *   Componente   { id, label, fabricante, tecnologia,
 *                  estoque: { codigoSap, unidadeMedida, min, max, atual,
 *                             custoUnitario, localizacao } | null,
 *                  meta: { ute, linha, operacao, tipoMaquina, codTipoMaquina, maquina } }
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─── helpers ─────────────────────────────────────────────────────────────────

/** Extrai o array `data` do envelope da API. */
const toList = (json) => json?.data ?? [];

/** Shape genérico compartilhado por Ute / Linha / Operacao / Maquina */
const mapGenericItem = (item) => ({
  id: item.id,
  label: item.label,
  count: item.count ?? 0,
  countType: item.countType ?? "",
});

// ─── mappers públicos ─────────────────────────────────────────────────────────

/**
 * /utes  →  Ute[]
 */
export const mapUtes = (json) => toList(json).map(mapGenericItem);

/**
 * /linhas  →  Linha[]
 */
export const mapLinhas = (json) => toList(json).map(mapGenericItem);

/**
 * /operacoes  →  Operacao[]
 */
export const mapOperacoes = (json) => toList(json).map(mapGenericItem);

/**
 * /tipologia  →  TipoMaquina[]
 *
 * Diferença: tem subCount / subCountType e codTipoMaquina
 */
export const mapTipologia = (json) =>
  toList(json).map((item) => ({
    id: item.id,
    label: item.label,
    codTipoMaquina: item.codTipoMaquina ?? item.id, // 🔥 prioriza o código específico, fallback id
    count: item.count ?? 0,
    countType: item.countType ?? "",
    subCount: item.subCount ?? 0,
    subCountType: item.subCountType ?? "",
  }));

/**
 * /maquinas  →  Maquina[]
 */
export const mapMaquinas = (json) => toList(json).map(mapGenericItem);

/**
 * /componentes  →  Componente[]
 *
 * A API retorna campos aninhados em `meta` e `estoque`.
 * O mapper os achata / renomeia para o modelo de domínio.
 */
export const mapComponentes = (json) =>
  toList(json).map((item) => ({
    id: item.id,
    label: item.label,

    // campos de negócio vindos de meta
    fabricante: item.fabricante ?? null,
    tecnologia: item.tecnologia ?? null,

    descComponente: item.descComponente,
    caracTecnicas: item.caracTecnicas,
    codComercial: item.codComercial,
    codSAP: item.codSAP,
    codDotacao: item.codDotacao,
    dataCriacao: item.dataCriacao,

    // localização hierárquica
    meta: {
      ute: item.meta?.ute ?? null,
      linha: item.meta?.linha ?? null,
      operacao: item.meta?.operacao ?? null,
      tipoMaquina: item.meta?.tipoMaquina ?? null,
      codTipoMaquina: item.meta?.codTipoMaquina ?? item.codTipoMaquina ?? null, // 🔥 preserva o código
      maquina: item.meta?.maquina ?? null,
      mMaquina: item.meta?.mMaquina ?? null,
    },

    // dados de estoque (pode vir null se não cadastrado)
    estoque: item.estoque
      ? {
          codigoSap: item.estoque.codigoSap,
          unidadeMedida: item.estoque.unidadeMedida,
          min: item.estoque.min ?? 0,
          max: item.estoque.max ?? 0,
          atual: item.estoque.atual ?? 0,
          custoUnitario: item.estoque.custoUnitario ?? 0,
          localizacao: item.estoque.localizacao ?? null,
        }
      : null,
  }));
