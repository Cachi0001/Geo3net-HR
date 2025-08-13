import { useState, useEffect } from 'react'

interface RateLimitInfo {
  attempts: number
  lastAttempt: string
  isLimited: boolean
  resetTime: string | null
}

const STORAGE_KEY = 'password_reset_rate_limit'
const MAX_ATTEMPTS = 5
const RATE_LIMIT_HOURS = 24

export const usePasswordResetRateLimit = () => {
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo>({
    attempts: 0,
    lastAttempt: '',
    isLimited: false,
    resetTime: null
  })

  useEffect(() => {
    // Load rate limit info from localStorage on component mount
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        const now = new Date()
        const lastAttempt = new Date(parsed.lastAttempt)
        const hoursSinceLastAttempt = (now.getTime() - lastAttempt.getTime()) / (1000 * 60 * 60)

        if (hoursSinceLastAttempt >= RATE_LIMIT_HOURS) {
          // Reset if 24 hours have passed
          const resetInfo = {
            attempts: 0,
            lastAttempt: '',
            isLimited: false,
            resetTime: null
          }
          setRateLimitInfo(resetInfo)
          localStorage.setItem(STORAGE_KEY, JSON.stringify(resetInfo))
        } else {
          // Check if still rate limited
          const isLimited = parsed.attempts >= MAX_ATTEMPTS
          const resetTime = isLimited 
            ? new Date(lastAttempt.getTime() + (RATE_LIMIT_HOURS * 60 * 60 * 1000)).toISOString()
            : null

          setRateLimitInfo({
            ...parsed,
            isLimited,
            resetTime
          })
        }
      } catch (error) {
        console.error('Failed to parse rate limit info:', error)
        localStorage.removeItem(STORAGE_KEY)
      }
    }
  }, [])

  const recordAttempt = () => {
    const now = new Date()
    const newInfo = {
      attempts: rateLimitInfo.attempts + 1,
      lastAttempt: now.toISOString(),
      isLimited: rateLimitInfo.attempts + 1 >= MAX_ATTEMPTS,
      resetTime: rateLimitInfo.attempts + 1 >= MAX_ATTEMPTS 
        ? new Date(now.getTime() + (RATE_LIMIT_HOURS * 60 * 60 * 1000)).toISOString()
        : null
    }

    setRateLimitInfo(newInfo)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newInfo))
  }

  const getRemainingTime = (): string | null => {
    if (!rateLimitInfo.resetTime) return null

    const now = new Date()
    const resetTime = new Date(rateLimitInfo.resetTime)
    const remainingMs = resetTime.getTime() - now.getTime()

    if (remainingMs <= 0) return null

    const hours = Math.floor(remainingMs / (1000 * 60 * 60))
    const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60))

    if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else {
      return `${minutes}m`
    }
  }

  const getRemainingAttempts = (): number => {
    return Math.max(0, MAX_ATTEMPTS - rateLimitInfo.attempts)
  }

  return {
    isLimited: rateLimitInfo.isLimited,
    attempts: rateLimitInfo.attempts,
    remainingAttempts: getRemainingAttempts(),
    remainingTime: getRemainingTime(),
    recordAttempt,
    maxAttempts: MAX_ATTEMPTS
  }
}