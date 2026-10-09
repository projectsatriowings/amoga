export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: `Endpoint not found: ${req.method} ${req.originalUrl}`,
  });
}

export function errorHandler(err, req, res, _next) {
  console.error('[SERVER ERROR]:', err);

  const status = err.status || 500;
  const message = status === 500 ? 'Internal server error occurred' : err.message;

  res.status(status).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && err.details ? { details: err.details } : {}),
  });
}
