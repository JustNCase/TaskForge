import { Request, Response, NextFunction } from 'express';
import { getSession } from '../lib/auth';

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await getSession(token);

    (req as any).user = user;

    next();
  } catch {
    res.status(401).json({ error: 'Invalid session' });
  }
}
