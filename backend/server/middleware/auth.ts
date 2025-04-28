import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { CustomError } from './errorHandler';

const prisma = new PrismaClient();

export interface AuthRequest extends Request {
  user?: any;
}

export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      const error = new Error('Not authorized to access this route') as CustomError;
      error.statusCode = 401;
      throw error;
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!);
      
      if (typeof decoded === 'string') {
        throw new Error('Invalid token');
      }

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true
        }
      });

      if (!user) {
        const error = new Error('User not found') as CustomError;
        error.statusCode = 404;
        throw error;
      }

      req.user = user;
      next();
    } catch (error) {
      const err = new Error('Not authorized to access this route') as CustomError;
      err.statusCode = 401;
      throw err;
    }
  } catch (error) {
    next(error);
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      const error = new Error(
        'User role not authorized to access this route'
      ) as CustomError;
      error.statusCode = 403;
      return next(error);
    }
    next();
  };
}; 