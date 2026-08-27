import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const roleCheck = (requiredRole: string) => {
  return (req: any, res: Response, next: NextFunction): any => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Access Denied: No token provided' });
    }

    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey');
      req.user = decoded;

      if ((req.user as any).role !== requiredRole && (req.user as any).role !== 'admin') {
        return res.status(403).json({ message: 'Access Denied: Insufficient permissions' });
      }

      next();
    } catch (error) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
  };
};

export default roleCheck;
