import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { CustomError } from './errorHandler';

const prisma = new PrismaClient();

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
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
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        id: string;
      };

      // Get user from database
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          role: true,
          isActive: true
        }
      });

      if (!user) {
        const error = new Error('User not found') as CustomError;
        error.statusCode = 404;
        throw error;
      }

      if (!user.isActive) {
        const error = new Error('User account is deactivated') as CustomError;
        error.statusCode = 403;
        throw error;
      }

      // Add user to request object
      req.user = {
        id: user.id,
        role: user.role
      };

      next();
    } catch (error) {
      const customError = new Error('Not authorized to access this route') as CustomError;
      customError.statusCode = 401;
      throw customError;
    }
  } catch (error) {
    next(error);
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      const error = new Error('Not authorized to access this route') as CustomError;
      error.statusCode = 401;
      return next(error);
    }

    if (!roles.includes(req.user.role)) {
      const error = new Error('Not authorized to access this route') as CustomError;
      error.statusCode = 403;
      return next(error);
    }

    next();
  };
}; 