// utils/array.js
export function extractCodigosSAP(rows) {
  return [
    ...new Set(
      rows.flatMap((r) =>
        (r.codSAP || "")
          .split("/")
          .map((c) => c.trim())
          .filter(Boolean),
      ),
    ),
  ];
}
