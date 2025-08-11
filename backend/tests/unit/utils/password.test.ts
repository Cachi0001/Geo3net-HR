import { hashPassword, comparePassword, generateTemporaryPassword, generateResetToken, validatePasswordStrength } from '../../../src/utils/password'

describe('Password Utils', () => {
    describe('hashPassword', () => {
        it('should hash a password', async () => {
            const password = 'testPassword123'
            const hashed = await hashPassword(password)
            expect(hashed).not.toBe(password)
            expect(hashed.length).toBeGreaterThan(50)
        })

        it('should generate different hashes for same password', async () => {
            const password = 'testPassword123'
            const hash1 = await hashPassword(password)
            const hash2 = await hashPassword(password)
            expect(hash1).not.toBe(hash2)
        })
    })

    describe('comparePassword', () => {
        it('should return true for correct password', async () => {
            const password = 'testPassword123'
            const hashed = await hashPassword(password)
            const isValid = await comparePassword(password, hashed)
            expect(isValid).toBe(true)
        })

        it('should return false for incorrect password', async () => {
            const password = 'testPassword123'
            const wrongPassword = 'wrongPassword123'
            const hashed = await hashPassword(password)
            const isValid = await comparePassword(wrongPassword, hashed)
            expect(isValid).toBe(false)
        })
    })

    describe('generateTemporaryPassword', () => {
        it('should generate a 12 character password', () => {
            const password = generateTemporaryPassword()
            expect(password.length).toBe(12)
        })

        it('should generate different passwords each time', () => {
            const password1 = generateTemporaryPassword()
            const password2 = generateTemporaryPassword()
            expect(password1).not.toBe(password2)
        })

        it('should only contain allowed characters', () => {
            const password = generateTemporaryPassword()
            const allowedChars = /^[ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789]+$/
            expect(allowedChars.test(password)).toBe(true)
        })
    })

    describe('generateResetToken', () => {
        it('should generate a 64 character hex token', () => {
            const token = generateResetToken()
            expect(token.length).toBe(64)
            expect(/^[a-f0-9]+$/.test(token)).toBe(true)
        })

        it('should generate different tokens each time', () => {
            const token1 = generateResetToken()
            const token2 = generateResetToken()
            expect(token1).not.toBe(token2)
        })
    })

    describe('validatePasswordStrength', () => {
        it('should validate a strong password', () => {
            const result = validatePasswordStrength('StrongPass123')
            expect(result.isValid).toBe(true)
            expect(result.errors).toHaveLength(0)
        })

        it('should reject password too short', () => {
            const result = validatePasswordStrength('Short1')
            expect(result.isValid).toBe(false)
            expect(result.errors).toContain('Password must be at least 8 characters long')
        })

        it('should reject password without uppercase', () => {
            const result = validatePasswordStrength('lowercase123')
            expect(result.isValid).toBe(false)
            expect(result.errors).toContain('Password must contain at least one uppercase letter')
        })

        it('should reject password without lowercase', () => {
            const result = validatePasswordStrength('UPPERCASE123')
            expect(result.isValid).toBe(false)
            expect(result.errors).toContain('Password must contain at least one lowercase letter')
        })

        it('should reject password without numbers', () => {
            const result = validatePasswordStrength('NoNumbers')
            expect(result.isValid).toBe(false)
            expect(result.errors).toContain('Password must contain at least one number')
        })

        it('should return multiple errors for weak password', () => {
            const result = validatePasswordStrength('weak')
            expect(result.isValid).toBe(false)
            expect(result.errors.length).toBeGreaterThan(1)
        })
    })
})