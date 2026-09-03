// middlewares/area.middleware.js
import { pool } from "../postgreConnect.js";

export const areaMiddleware =
  (requiredAreas = []) =>
  (req, res, next) => {
    // console.log(req.user);
    if (!req.user || !req.user.area) {
      return res.status(403).json({ error: "Área não definida" });
    }

    const allowed = requiredAreas.includes(req.user.area);

    if (!allowed) {
      return res.status(403).json({
        error: "Sem permissão para realizar a ação",
      });
    }

    next();
  };

export const validarAreaDaJustificativa = () => {
  return async (req, res, next) => {
    const { id } = req.params;
    // console.log("Validando área para justificativa ID:", id);

    try {
      //  1. Buscar justificativa
      const { rows } = await pool.query(
        `
          SELECT id, validador
          FROM cap.dim_justificativa
          WHERE id = $1
          `,
        [id],
      );

      if (rows.length === 0) {
        return res.status(404).json({
          error: "Justificativa não encontrada",
        });
      }

      const justificativa = rows[0];
      console.log("Justificativa encontrada:", req.user);

      // 2. Validar usuário
      if (!req.user || !req.user.area) {
        return res.status(403).json({
          error: "Usuário sem área definida",
        });
      }

      if (req.user.area !== justificativa.validador) {
        return res.status(403).json({
          error: "Sem permissão para validar essa justificativa",
        });
      }

      //  3. Evitar nova query depois (ótima prática)
      req.justificativa = justificativa;

      next();
    } catch (err) {
      console.error("Erro no middleware validarAreaDaJustificativa:", err);

      return res.status(500).json({
        error: "Erro interno",
      });
    }
  };
};
