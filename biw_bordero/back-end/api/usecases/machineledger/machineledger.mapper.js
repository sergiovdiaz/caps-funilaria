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

  // console.log(obj);
  return obj;
}

// export function mapComponenteBase(row) {
//   return {
//     id: row.id,
//     ...mapRow(row),
//   };
// }

export function mapToOption({
  id,
  label,
  count,
  countType,
  subCount,
  subCountType,
  meta = {},
  ...rest
}) {
  return {
    id,
    label,
    count: count !== undefined ? Number(count) : undefined,
    countType,
    subCount: subCount !== undefined ? Number(subCount) : undefined,
    subCountType,
    ...rest,
    meta,
  };
}

export function addComponenteEstoque(componente, materiaisMap) {
  const cod = (componente.codSAP || "")
    .split("/")
    .map((c) => c.trim())
    .find(Boolean);

  if (!cod) return componente;

  const mat = materiaisMap[cod];
  if (!mat) return componente;

  const estoque = mat.warehouses_material?.[0];

  const dadosEstoque = {
    codigoSap: cod,
    unidadeMedida: mat.measure_unit_abbr,
    min: estoque?.minimum_stock ?? null,
    max: estoque?.maximum_stock ?? null,
    atual: estoque?.current_stock ?? null,
    custoUnitario: estoque?.unitary_cost ?? mat.average_cost ?? null,
    localizacao: estoque?.location ?? null,
  };

  return {
    ...componente,
    dadosEstoque,
  };
}

// backend - buildMachineTree com path incluído
// utils/treeBuilder.js ou onde estiver sua função buildMachineTree
export function buildMachineTree(rows) {
  const treeMap = new Map();

  for (const r of rows) {
    const path = [
      r.ute,
      r.linha,
      r.operacao,
      r.tipoMaquina,
      r.maquina,
      r.descComponente,
    ].filter(Boolean);

    let current = treeMap;
    const codTipoMaquina = r.codTipoMaquina;

    for (let i = 0; i < path.length; i++) {
      const level = String(path[i]);
      const levelKey = path
        .slice(0, i + 1)
        .join("-")
        .replace(/\s/g, "_")
        .toLowerCase();

      if (!current.has(level)) {
        current.set(level, {
          id: levelKey,
          label: level,
          codTipoMaquina: i >= 3 ? codTipoMaquina : null, // 🔥 A partir do tipo (índice 3), todos herdam
          children: new Map(),
        });
      } else if (i >= 3 && codTipoMaquina) {
        // 🔥 Para máquina e componentes, se não tiver código, usa do registro
        const existing = current.get(level);
        if (!existing.codTipoMaquina && codTipoMaquina) {
          existing.codTipoMaquina = codTipoMaquina;
        }
      }

      current = current.get(level).children;
    }
  }

  function convert(map) {
    return Array.from(map.values()).map((node) => ({
      id: node.id,
      label: node.label,
      codTipoMaquina: node.codTipoMaquina,
      children: convert(node.children),
    }));
  }

  return convert(treeMap);
}
