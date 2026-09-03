import jwt from "jsonwebtoken";

export const authMiddleware = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  // console.log("AUTH HEADER:", req.headers.authorization);
  const token = authHeader?.split(" ")[1];
  if (!token)
    return res.status(401).json({
      error: "Você precisa estar logado para realizar esta operação.",
    });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    console.error("Token inválido:", err);
    return res.status(403).json({ error: "Token inválido" });
  }
};

// Middleware opcional para checar roles
export const roleMiddleware =
  (requiredRoles = []) =>
  (req, res, next) => {
    if (!req.user?.role) {
      return res.status(403).json({ error: "Sem permissão" });
    }

    if (!requiredRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Sem permissão" });
    }

    next();
  };
