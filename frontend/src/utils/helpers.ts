import { STORAGE_KEYS } from './constants'

// Local Storage Helpers
export const storage = {
  get: <T = any>(key: string): T | null => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : null
    } catch {
      return null
    }
  },

  set: (key: string, value: any): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error('Failed to save to localStorage:', error)
    }
  },

  remove: (key: string): void => {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error('Failed to remove from localStorage:', error)
    }
  },

  clear: (): void => {
    try {
      localStorage.clear()
    } catch (error) {
      console.error('Failed to clear localStorage:', error)
    }
  },
}

// URL Helpers
export const url = {
  buildQuery: (params: Record<string, any>): string => {
    const searchParams = new URLSearchParams()
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        if (Array.isArray(value)) {
          value.forEach(item => searchParams.append(key, String(item)))
        } else {
          searchParams.append(key, String(value))
        }
      }
    })
    
    return searchParams.toString()
  },

  parseQuery: (search: string): Record<string, string | string[]> => {
    const params = new URLSearchParams(search)
    const result: Record<string, string | string[]> = {}
    
    params.forEach((value, key) => {
      if (result[key]) {
        if (Array.isArray(result[key])) {
          (result[key] as string[]).push(value)
        } else {
          result[key] = [result[key] as string, value]
        }
      } else {
        result[key] = value
      }
    })
    
    return result
  },

  isValidUrl: (string: string): boolean => {
    try {
      new URL(string)
      return true
    } catch {
      return false
    }
  },
}

// Array Helpers
export const array = {
  unique: <T>(arr: T[]): T[] => [...new Set(arr)],

  groupBy: <T, K extends keyof T>(arr: T[], key: K): Record<string, T[]> => {
    return arr.reduce((groups, item) => {
      const group = String(item[key])
      groups[group] = groups[group] || []
      groups[group].push(item)
      return groups
    }, {} as Record<string, T[]>)
  },

  sortBy: <T>(arr: T[], key: keyof T, direction: 'asc' | 'desc' = 'asc'): T[] => {
    return [...arr].sort((a, b) => {
      const aVal = a[key]
      const bVal = b[key]
      
      if (aVal < bVal) return direction === 'asc' ? -1 : 1
      if (aVal > bVal) return direction === 'asc' ? 1 : -1
      return 0
    })
  },

  chunk: <T>(arr: T[], size: number): T[][] => {
    const chunks: T[][] = []
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size))
    }
    return chunks
  },

  shuffle: <T>(arr: T[]): T[] => {
    const shuffled = [...arr]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  },
}

// Object Helpers
export const object = {
  pick: <T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> => {
    const result = {} as Pick<T, K>
    keys.forEach(key => {
      if (key in obj) {
        result[key] = obj[key]
      }
    })
    return result
  },

  omit: <T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> => {
    const result = { ...obj }
    keys.forEach(key => {
      delete result[key]
    })
    return result
  },

  isEmpty: (obj: any): boolean => {
    if (obj == null) return true
    if (Array.isArray(obj) || typeof obj === 'string') return obj.length === 0
    if (obj instanceof Map || obj instanceof Set) return obj.size === 0
    return Object.keys(obj).length === 0
  },

  deepClone: <T>(obj: T): T => {
    if (obj === null || typeof obj !== 'object') return obj
    if (obj instanceof Date) return new Date(obj.getTime()) as any
    if (obj instanceof Array) return obj.map(item => object.deepClone(item)) as any
    if (typeof obj === 'object') {
      const cloned = {} as any
      Object.keys(obj).forEach(key => {
        cloned[key] = object.deepClone((obj as any)[key])
      })
      return cloned
    }
    return obj
  },
}

// String Helpers
export const string = {
  slugify: (text: string): string => {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
  },

  camelCase: (text: string): string => {
    return text
      .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
        return index === 0 ? word.toLowerCase() : word.toUpperCase()
      })
      .replace(/\s+/g, '')
  },

  kebabCase: (text: string): string => {
    return text
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase()
  },

  snakeCase: (text: string): string => {
    return text
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .replace(/[\s-]+/g, '_')
      .toLowerCase()
  },

  titleCase: (text: string): string => {
    return text.replace(/\w\S*/g, (txt) => {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    })
  },

  stripHtml: (html: string): string => {
    const tmp = document.createElement('div')
    tmp.innerHTML = html
    return tmp.textContent || tmp.innerText || ''
  },
}

// Date Helpers
export const date = {
  isToday: (date: Date | string): boolean => {
    const today = new Date()
    const checkDate = typeof date === 'string' ? new Date(date) : date
    
    return (
      checkDate.getDate() === today.getDate() &&
      checkDate.getMonth() === today.getMonth() &&
      checkDate.getFullYear() === today.getFullYear()
    )
  },

  isYesterday: (date: Date | string): boolean => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const checkDate = typeof date === 'string' ? new Date(date) : date
    
    return (
      checkDate.getDate() === yesterday.getDate() &&
      checkDate.getMonth() === yesterday.getMonth() &&
      checkDate.getFullYear() === yesterday.getFullYear()
    )
  },

  isTomorrow: (date: Date | string): boolean => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const checkDate = typeof date === 'string' ? new Date(date) : date
    
    return (
      checkDate.getDate() === tomorrow.getDate() &&
      checkDate.getMonth() === tomorrow.getMonth() &&
      checkDate.getFullYear() === tomorrow.getFullYear()
    )
  },

  addDays: (date: Date | string, days: number): Date => {
    const result = new Date(date)
    result.setDate(result.getDate() + days)
    return result
  },

  startOfDay: (date: Date | string): Date => {
    const result = new Date(date)
    result.setHours(0, 0, 0, 0)
    return result
  },

  endOfDay: (date: Date | string): Date => {
    const result = new Date(date)
    result.setHours(23, 59, 59, 999)
    return result
  },

  getDaysDifference: (date1: Date | string, date2: Date | string): number => {
    const d1 = typeof date1 === 'string' ? new Date(date1) : date1
    const d2 = typeof date2 === 'string' ? new Date(date2) : date2
    const timeDiff = Math.abs(d2.getTime() - d1.getTime())
    return Math.ceil(timeDiff / (1000 * 3600 * 24))
  },
}

// Async Helpers
export const async = {
  delay: (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms))
  },

  retry: async <T>(
    fn: () => Promise<T>,
    retries: number = 3,
    delay: number = 1000
  ): Promise<T> => {
    try {
      return await fn()
    } catch (error) {
      if (retries > 0) {
        await async.delay(delay)
        return async.retry(fn, retries - 1, delay * 2)
      }
      throw error
    }
  },

  timeout: <T>(promise: Promise<T>, ms: number): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Operation timed out')), ms)
      ),
    ])
  },
}

// Device Detection
export const device = {
  isMobile: (): boolean => {
    return window.innerWidth < 768
  },

  isTablet: (): boolean => {
    return window.innerWidth >= 768 && window.innerWidth < 1024
  },

  isDesktop: (): boolean => {
    return window.innerWidth >= 1024
  },

  isTouchDevice: (): boolean => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0
  },

  getViewportSize: (): { width: number; height: number } => {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
    }
  },
}

// Color Helpers
export const color = {
  hexToRgb: (hex: string): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null
  },

  rgbToHex: (r: number, g: number, b: number): string => {
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16)
      return hex.length === 1 ? '0' + hex : hex
    }).join('')
  },

  getContrastColor: (hex: string): string => {
    const rgb = color.hexToRgb(hex)
    if (!rgb) return '#000000'
    
    const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000
    return brightness > 128 ? '#000000' : '#ffffff'
  },
}

// Performance Helpers
export const performance = {
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void => {
    let timeout: NodeJS.Timeout
    return (...args: Parameters<T>) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => func(...args), wait)
    }
  },

  throttle: <T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void => {
    let inThrottle: boolean
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args)
        inThrottle = true
        setTimeout(() => (inThrottle = false), limit)
      }
    }
  },
}