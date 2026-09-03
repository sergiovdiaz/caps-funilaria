import test from "node:test";
import assert from "node:assert/strict";
import {
  classifyLossVoice,
  LOSS_VOICES,
  LOSS_VOICE_RESULTS,
} from "../api/usecases/cap/utils/cap.lossVoices.js";
import { limitHourlyLosses } from "../api/usecases/cap/utils/cap.lossLimit.js";

const base = (overrides = {}) => ({
  line: "SCC",
  ts_inicio: "2026-09-02T07:00:00.000Z",
  ts_fim: "2026-09-02T08:00:00.000Z",
  reasondesc: "Quebras",
  valor: 10,
  ...overrides,
});

test("classifica as 13 categorias do quadro CAP", () => {
  const cases = [
    ["New Product/Process", "Induced Dow Time"],
    ["Cycle time losses", "Loss of time cycle"],
    ["Quality lock (exped/Delivery)", "Quality Loss"],
    ["Line Stoppages", "Operating Loss"],
    ["Functional stops", "Functional stops"],
    ["Saturation", "Induced Dow Time"],
    ["Breakdown time", "Equipment failures"],
    ["Missing part - Supplier", "Losses Product/Process"],
    ["Missing Body", "Induced Dow Time"],
    ["Energy / IT", "Induced Dow Time"],
    ["Kitting stoppages", "Induced Dow Time"],
    ["Missing Part - Internal Log", "Induced Dow Time"],
    ["Unspecified losses", "Unspecified losses"],
  ];

  for (const [group, expectedVoice] of cases) {
    assert.equal(classifyLossVoice({ group }).voice, expectedVoice);
  }
});

test("aplica a exceção PPA + quebra = Missing Body", () => {
  const result = classifyLossVoice({ line: "PPA", reasonDesc: "Quebras" });
  assert.equal(result.group, LOSS_VOICES.MISSING_BODY);
  assert.equal(result.voice, LOSS_VOICE_RESULTS[LOSS_VOICES.MISSING_BODY]);
});

test("limita perda total da hora ao JPH máximo", () => {
  const rows = [
    base({ reasondesc: "REALIZADO", valor: 50 }),
    base({ reasondesc: "Quebras", valor: 40 }),
    base({ reasondesc: "Microparadas", valor: 29 }),
  ];

  const result = limitHourlyLosses(rows, 45);
  const lossTotal = result
    .filter((r) => r.reasondesc !== "REALIZADO")
    .reduce((sum, r) => sum + Number(r.valor), 0);

  assert.equal(lossTotal, 45);
  assert.equal(result[1].perda_limitada, true);
  assert.equal(result[2].perda_limitada, true);
});
