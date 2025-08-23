import { Request, Response, NextFunction } from 'express'
import { AppError, ValidationError } from '../utils/errors'
import { ResponseHandler } from '../utils/response'

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): Response | void => {
  console.log('🔍 [ErrorHandler] Error caught:', {
    name: error.name,
    message: error.message,
    isValidationError: error instanceof ValidationError,
    errors: error instanceof ValidationError ? error.errors : undefined
  })
  
  if (error instanceof ValidationError) {
    console.log('🔍 [ErrorHandler] ValidationError details:', {
      message: error.message,
      errors: error.errors,
      errorsLength: error.errors?.length
    })
    return ResponseHandler.validationError(res, error.errors)
  }

  if (error instanceof AppError) {
    return ResponseHandler.error(res, error.message, error.statusCode)
  }

  console.error('Unexpected error:', error)
  return ResponseHandler.internalError(res)
}

export const notFoundHandler = (req: Request, res: Response): Response => {
  console.log('🔍 notFoundHandler - Route not found:', req.method, req.originalUrl)
  console.log('🔍 notFoundHandler - Available routes should include /api/users/profile')
  return ResponseHandler.notFound(res, `Route ${req.originalUrl} not found`)
}