import { Request, Response, NextFunction } from 'express'
import { authenticateToken, requireRole, optionalAuth, AuthenticatedRequest } from '../../../src/middleware/auth'
import { generateAccessToken, TokenPayload } from '../../../src/utils/jwt'

describe('Auth Middleware', () => {
  let mockRequest: Partial<AuthenticatedRequest>
  let mockResponse: Partial<Response>
  let mockNext: NextFunction

  const mockPayload: TokenPayload = {
    userId: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    role: 'employee'
  }

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret-key'
  })

  beforeEach(() => {
    mockRequest = {
      headers: {}
    }
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    }
    mockNext = jest.fn()
  })

  describe('authenticateToken', () => {
    it('should authenticate valid token', () => {
      const token = generateAccessToken(mockPayload)
      mockRequest.headers = {
        authorization: `Bearer ${token}`
      }

      authenticateToken(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext)

      expect(mockRequest.user).toBeDefined()
      expect(mockRequest.user?.userId).toBe(mockPayload.userId)
      expect(mockNext).toHaveBeenCalled()
    })

    it('should reject request without token', () => {
      authenticateToken(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext)

      expect(mockResponse.status).toHaveBeenCalledWith(401)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access token required'
      })
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('should reject invalid token', () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid-token'
      }

      authenticateToken(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext)

      expect(mockResponse.status).toHaveBeenCalledWith(403)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid or expired token'
      })
      expect(mockNext).not.toHaveBeenCalled()
    })
  })

  describe('requireRole', () => {
    it('should allow access for authorized role', () => {
      mockRequest.user = mockPayload
      const middleware = requireRole(['employee', 'manager'])

      middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext)

      expect(mockNext).toHaveBeenCalled()
    })

    it('should deny access for unauthorized role', () => {
      mockRequest.user = mockPayload
      const middleware = requireRole(['manager', 'admin'])

      middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext)

      expect(mockResponse.status).toHaveBeenCalledWith(403)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Insufficient permissions'
      })
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('should deny access without authentication', () => {
      const middleware = requireRole(['employee'])

      middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext)

      expect(mockResponse.status).toHaveBeenCalledWith(401)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required'
      })
      expect(mockNext).not.toHaveBeenCalled()
    })
  })

  describe('optionalAuth', () => {
    it('should set user for valid token', () => {
      const token = generateAccessToken(mockPayload)
      mockRequest.headers = {
        authorization: `Bearer ${token}`
      }

      optionalAuth(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext)

      expect(mockRequest.user).toBeDefined()
      expect(mockRequest.user?.userId).toBe(mockPayload.userId)
      expect(mockNext).toHaveBeenCalled()
    })

    it('should continue without user for invalid token', () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid-token'
      }

      optionalAuth(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext)

      expect(mockRequest.user).toBeUndefined()
      expect(mockNext).toHaveBeenCalled()
    })

    it('should continue without user when no token provided', () => {
      optionalAuth(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext)

      expect(mockRequest.user).toBeUndefined()
      expect(mockNext).toHaveBeenCalled()
    })
  })
})