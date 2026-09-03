// machineledger.mapper.js
import { ML } from "./machineledger.schema.js";

export function mapMateriaisByCodigo(materiais) {
  return materiais.reduce((acc, mat) => {
    acc[mat.code] = mat;
    return acc;
  }, {});
}

export function mapRow(row) {
  const obj = {};
  // console.log(row);

  for (const dbKey in ML) {
    const apiKey = ML[dbKey];
    obj[apiKey] = row[dbKey];
  }

  return obj;
}

export function mapComponenteBase(row) {
  return {
    id: row.id,
    ...mapRow(row),
  };
}

export function addComponenteEstoque(componente, materiaisMap) {
  const cod = (componente.codSAP || "")
    .split("/")
    .map((c) => c.trim())
    .find(Boolean); // 👈 só o primeiro válido

  if (!cod) return componente;

  const mat = materiaisMap[cod];
  if (!mat) return componente;

  const estoque = mat.warehouses_material?.[0];

  const dadosEstoque = {
    codigoSap: cod,
    unidadeMedida: mat.measure_unit_abbr,
    estoqueMin: estoque?.minimum_stock ?? null,
    estoqueMax: estoque?.maximum_stock ?? null,
    estoqueAtual: estoque?.current_stock ?? null,
    custoUnitario: estoque?.unitary_cost ?? mat.average_cost ?? null,
    localizacao: estoque?.location ?? null,
  };

  return {
    ...componente,
    dadosEstoque, 
  };
}

// export function mapComponente(row, materiaisMap) {
//   return {
//     id: row.id,

//     [ML.ute]: row.ute,
//     [ML.linha]: row.linha,
//     [ML.operacao]: row.operacao,
//     [ML.tipo_maquina]: row.tipo_maquina,
//     [ML.maquina]: row.maquina,
//     [ML.m_maquina]: row.m_maquina,

//     [ML.descricao_componente]: row.descricao_componente,
//     [ML.caracteristicas_tecnicas]: row.caracteristicas_tecnicas,
//     [ML.fabricante]: row.fabricante,

//     [ML.codigo_comercial]: row.codigo_comercial,
//     [ML.codigo_sap]: row.codigo_sap,
//     [ML.codigo_dotacao]: row.codigo_dotacao,

//     [ML.tecnologia]: row.tecnologia,
//     [ML.data_criacao]: row.data_criacao,
//   };
// }
