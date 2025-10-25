import { logger } from '../utils/logger.js';
export function errorHandler(err, req, res, next) {
  logger.error({ err: err.stack, path: req.path });
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
}
