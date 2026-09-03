export function successResponse(data, meta = {}) {
  return {
    success: true,
    data,
    meta: {
      count: Array.isArray(data) ? data.length : 1,
      ...meta,
    },
  };
}

export function errorResponse(message, code = "INTERNAL_ERROR") {
  return {
    success: false,
    error: {
      message,
      code,
    },
  };
}

export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export const requireParams = (res, params) => {
  const missing = params.filter((p) => !p.value);

  if (missing.length > 0) {
    res
      .status(400)
      .json(
        errorResponse(
          `Parâmetros obrigatórios: ${missing.map((p) => p.name).join(", ")}`,
        ),
      );
    return true;
  }

  return false;
};

export const requireParams2 = (req, res, params) => {
  const missing = params.filter((p) => !req.query?.[p]);

  if (missing.length > 0) {
    res
      .status(400)
      .json(errorResponse(`Parâmetros obrigatórios: ${missing.join(", ")}`));
    return true;
  }

  return false;
};