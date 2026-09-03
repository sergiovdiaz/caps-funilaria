import { useMemo } from "react";

/**
 * Hook para gerar breadcrumbs baseado no estado da página
 * @param {Object} params
 * @param {string} params.step - passo atual ("ute", "linha", "operacao", "tipoMaquina", "maquina", "componentes")
 * @param {string|null} params.selUTE
 * @param {string|null} params.selLinha
 * @param {string|null} params.selOp
 * @param {Object|null} params.selTipo
 * @param {string|null} params.selMaquina
 * @param {Function} params.setStep
 * @returns {Array} breadcrumbs
 */
export const useBreadcrumbs = ({ path, step, onStepClick }) => {
  return useMemo(() => {
    const crumbs = [
      {
        label: "UTEs",
        onClick: step !== "ute" ? () => onStepClick("ute") : null,
      },
    ];

    path.forEach((p) => {
      const label = typeof p.value === "object" ? p.value.label : p.value;

      crumbs.push({
        label,
        onClick: () => onStepClick(p.level),
      });
    });

    return crumbs;
  }, [path, step, onStepClick]);
};
