/**
 * useMachineData.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Hook que orquestra os fetches hierárquicos do MachineLedger.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useEffect, useState } from "react";
import * as http from "../../../../api/machineledger.http";
import * as mappers from "../utils/mapper";

export function useMachineData(
  selUte,
  selLinha,
  selOperacao,
  selTipoMaquina,
  selMaquina,
) {
  const [utes, setUtes] = useState([]);
  const [linhas, setLinhas] = useState([]);
  const [operacoes, setOperacoes] = useState([]);
  const [tiposMaquina, setTipos] = useState([]);
  const [maquinas, setMaquinas] = useState([]);
  const [componentes, setComponentes] = useState([]);

  //   console.log("📊 useMachineData recebeu:", {
  //   selUte,
  //   selLinha,
  //   selOperacao,
  //   selTipoMaquina,
  //   selMaquina,
  //   tipoMaquinaLabel: selTipoMaquina?.label,
  // });

  const [loading, setLoading] = useState({
    utes: false,
    linhas: false,
    operacoes: false,
    tiposMaquina: false,
    maquinas: false,
    componentes: false,
  });

  // ── UTE ─────────────────────────────────────────────────────────────
  useEffect(() => {
    setLoading((l) => ({ ...l, utes: true }));
    http
      .fetchUtes()
      .then(mappers.mapUtes)
      .then(setUtes)
      .catch(console.error)
      .finally(() => setLoading((l) => ({ ...l, utes: false })));
  }, []);

  // ── LINHAS ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!selUte) {
      setLinhas([]);
      return;
    }
    setLoading((l) => ({ ...l, linhas: true }));
    http
      .fetchLinhas(selUte)
      .then(mappers.mapLinhas)
      .then(setLinhas)
      .catch(console.error)
      .finally(() => setLoading((l) => ({ ...l, linhas: false })));
  }, [selUte]);

  // ── OPERAÇÕES ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!selLinha) {
      setOperacoes([]);
      return;
    }
    setLoading((l) => ({ ...l, operacoes: true }));
    http
      .fetchOperacoes(selLinha)
      .then(mappers.mapOperacoes)
      .then(setOperacoes)
      .catch(console.error)
      .finally(() => setLoading((l) => ({ ...l, operacoes: false })));
  }, [selLinha]);

  // ── TIPOS DE MÁQUINA ────────────────────────────────────────────────
  useEffect(() => {
    if (!selLinha || selOperacao == null) {
      setTipos([]);
      return;
    }
    setLoading((l) => ({ ...l, tiposMaquina: true }));
    http
      .fetchTipologia(selLinha, selOperacao)
      .then(mappers.mapTipologia) // 🔥 Aqui já vem com codTipoMaquina
      .then(setTipos)
      .catch(console.error)
      .finally(() => setLoading((l) => ({ ...l, tiposMaquina: false })));
  }, [selLinha, selOperacao]);

  // ── MÁQUINAS ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!selLinha || selOperacao == null || !selTipoMaquina) {
      setMaquinas([]);
      return;
    }
    setLoading((l) => ({ ...l, maquinas: true }));
    http
      .fetchMaquinas(selLinha, selOperacao, selTipoMaquina.label)
      .then(mappers.mapMaquinas)
      .then(setMaquinas)
      .catch(console.error)
      .finally(() => setLoading((l) => ({ ...l, maquinas: false })));
  }, [selLinha, selOperacao, selTipoMaquina]);

  // ── COMPONENTES ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!selMaquina) {
      setComponentes([]);
      return;
    }
    setLoading((l) => ({ ...l, componentes: true }));
    http
      .fetchComponentes(selMaquina)
      .then(mappers.mapComponentes)
      .then(setComponentes)
      .catch(console.error)
      .finally(() => setLoading((l) => ({ ...l, componentes: false })));
  }, [selMaquina]);

  return {
    utes,
    linhas,
    operacoes,
    tiposMaquina,
    maquinas,
    componentes,
    loading,
  };
}
