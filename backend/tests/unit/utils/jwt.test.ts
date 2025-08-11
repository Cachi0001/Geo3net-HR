import { generateAccessToken, generateRefreshToken, generateTokens, verifyToken, decodeToken, TokenPayload } from '../../../src/utils/jwt'

describe('JWT Utils', () => {
  const mockPayload: TokenPayload = {
    userId: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    role: 'employee'
  }

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret-key'
    process.env.JWT_EXPIRES_IN = '1h'
    process.env.JWT_REFRESH_EXPIRES_IN = '7d'
  })

  describe('generateAccessToken', () => {
    it('should generate a valid access token', () => {
      const token = generateAccessToken(mockPayload)
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3)
    })
  })

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      const token = generateRefreshToken(mockPayload)
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3)
    })
  })

  describe('generateTokens', () => {
    it('should generate both access and refresh tokens', () => {
      const tokens = generateTokens(mockPayload)
      expect(tokens).toHaveProperty('accessToken')
      expect(tokens).toHaveProperty('refreshToken')
      expect(tokens).toHaveProperty('expiresIn')
      expect(tokens.expiresIn).toBe('1h')
    })
  })

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const token = generateAccessToken(mockPayload)
      const decoded = verifyToken(token)
      expect(decoded.userId).toBe(mockPayload.userId)
      expect(decoded.email).toBe(mockPayload.email)
      expect(decoded.role).toBe(mockPayload.role)
    })

    it('should throw error for invalid token', () => {
      expect(() => verifyToken('invalid-token')).toThrow('Invalid token')
    })
  })

  describe('decodeToken', () => {
    it('should decode a valid token without verification', () => {
      const token = generateAccessToken(mockPayload)
      const decoded = decodeToken(token)
      expect(decoded?.userId).toBe(mockPayload.userId)
      expect(decoded?.email).toBe(mockPayload.email)
      expect(decoded?.role).toBe(mockPayload.role)
    })

    it('should return null for invalid token', () => {
      const decoded = decodeToken('invalid-token')
      expect(decoded).toBeNull()
    })
  })
})