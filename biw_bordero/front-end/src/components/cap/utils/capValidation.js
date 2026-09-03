// utils/capValidation.js
import { CAUSAS, MODO_FALHA, COMPONENTE } from "./capConstant";

export function buildValidationErrors(editableData, maquinasOptions) {
  return {
    causaRaiz: !CAUSAS.includes(editableData.causaRaiz),
    maquina: !maquinasOptions.some((m) => m.maquina === editableData.maquina),
    componente: !COMPONENTE.includes(editableData.componente),
    descricao: !MODO_FALHA.includes(editableData.descricao),
    comentario: editableData.comentario.trim() === "",
  };
}
