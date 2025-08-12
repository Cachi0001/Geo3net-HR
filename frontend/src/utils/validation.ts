export const validationRules = {
  email: (value: string): string | null => {
    if (!value) return null
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(value) ? null : 'Please enter a valid email address'
  },

  password: (value: string): string | null => {
    if (!value) return null
    if (value.length < 8) return 'Password must be at least 8 characters long'
    if (!/(?=.*[a-z])/.test(value)) return 'Password must contain at least one lowercase letter'
    if (!/(?=.*[A-Z])/.test(value)) return 'Password must contain at least one uppercase letter'
    if (!/(?=.*\d)/.test(value)) return 'Password must contain at least one number'
    return null
  },

  required: (value: any): string | null => {
    if (value === null || value === undefined) return 'This field is required'
    if (typeof value === 'string' && !value.trim()) return 'This field is required'
    if (Array.isArray(value) && value.length === 0) return 'This field is required'
    return null
  },

  minLength: (min: number) => (value: string): string | null => {
    if (!value) return null
    return value.length >= min ? null : `Must be at least ${min} characters long`
  },

  maxLength: (max: number) => (value: string): string | null => {
    if (!value) return null
    return value.length <= max ? null : `Must be no more than ${max} characters long`
  },

  phone: (value: string): string | null => {
    if (!value) return null
    const phoneRegex = /^\+?[\d\s-()]+$/
    return phoneRegex.test(value) ? null : 'Please enter a valid phone number'
  },

  url: (value: string): string | null => {
    if (!value) return null
    try {
      new URL(value)
      return null
    } catch {
      return 'Please enter a valid URL'
    }
  },

  number: (value: string): string | null => {
    if (!value) return null
    return !isNaN(Number(value)) ? null : 'Please enter a valid number'
  },

  positiveNumber: (value: string): string | null => {
    if (!value) return null
    const num = Number(value)
    if (isNaN(num)) return 'Please enter a valid number'
    return num > 0 ? null : 'Please enter a positive number'
  },

  integer: (value: string): string | null => {
    if (!value) return null
    const num = Number(value)
    if (isNaN(num)) return 'Please enter a valid number'
    return Number.isInteger(num) ? null : 'Please enter a whole number'
  },

  date: (value: string): string | null => {
    if (!value) return null
    const date = new Date(value)
    return !isNaN(date.getTime()) ? null : 'Please enter a valid date'
  },

  futureDate: (value: string): string | null => {
    if (!value) return null
    const date = new Date(value)
    if (isNaN(date.getTime())) return 'Please enter a valid date'
    return date > new Date() ? null : 'Date must be in the future'
  },

  pastDate: (value: string): string | null => {
    if (!value) return null
    const date = new Date(value)
    if (isNaN(date.getTime())) return 'Please enter a valid date'
    return date < new Date() ? null : 'Date must be in the past'
  },

  confirmPassword: (password: string) => (value: string): string | null => {
    if (!value) return null
    return value === password ? null : 'Passwords do not match'
  },
}

export const validateForm = <T extends Record<string, any>>(
  values: T,
  rules: Record<keyof T, (value: any) => string | null>
): Record<keyof T, string> => {
  const errors = {} as Record<keyof T, string>

  Object.keys(rules).forEach((field) => {
    const rule = rules[field as keyof T]
    const error = rule(values[field as keyof T])
    if (error) {
      errors[field as keyof T] = error
    }
  })

  return errors
}

export const isFormValid = <T extends Record<string, any>>(
  errors: Record<keyof T, string>
): boolean => {
  return Object.values(errors).every(error => !error)
}