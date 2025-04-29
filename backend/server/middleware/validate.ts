import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { CustomError } from './errorHandler';

export const validate = (schema: AnyZodObject) => async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Ensure req.body exists
    if (!req.body) {
      const error = new Error('Request body is missing') as CustomError;
      error.statusCode = 400;
      return next(error);
    }

    // Parse the request body directly
    const result = await schema.parseAsync(req.body);

    // Replace the request body with the validated data
    req.body = result;
    
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