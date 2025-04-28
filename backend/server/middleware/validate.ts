import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { CustomError } from './errorHandler';

export const validate = (schema: AnyZodObject) => async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    return next();
  } catch (error) {
    if (error instanceof ZodError) {
      const errorMessage = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));
      
      const customError = new Error('Validation failed') as CustomError;
      customError.statusCode = 400;
      customError.errors = errorMessage;
      return next(customError);
    }
    return next(error);
  }
}; 