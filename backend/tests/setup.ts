import dotenv from 'dotenv'

dotenv.config({ path: '.env.test' })

process.env.JWT_SECRET = 'test-jwt-secret-key'
process.env.JWT_EXPIRES_IN = '1h'
process.env.JWT_REFRESH_EXPIRES_IN = '7d'

beforeAll(() => {
  jest.setTimeout(30000)
})

afterAll(() => {
  jest.clearAllTimers()
})