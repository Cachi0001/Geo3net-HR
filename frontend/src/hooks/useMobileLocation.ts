import { useState, useEffect, useCallback, useRef } from 'react'

interface LocationData {
  latitude: number
  longitude: number
  accuracy: number
  timestamp: number
}

interface UseMobileLocationReturn {
  location: LocationData | null
  locationError: string | null
  isLoading: boolean
  requestLocation: () => void
  watchLocation: () => void
  clearWatch: () => void
}

export const useMobileLocation = (): UseMobileLocationReturn => {
  const [location, setLocation] = useState<LocationData | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const watchIdRef = useRef<number | null>(null)

  const handleLocationSuccess = useCallback((position: GeolocationPosition) => {
    const locationData: LocationData = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: Date.now()
    }
    
    setLocation(locationData)
    setLocationError(null)
    setIsLoading(false)
    
    localStorage.setItem('lastKnownLocation', JSON.stringify(locationData))
  }, [])

  const handleLocationError = useCallback((error: GeolocationPositionError) => {
    let errorMessage = 'Unable to get location'
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'Location access denied. Please enable location services in your browser settings.'
        break
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Location information unavailable. Please check your GPS settings.'
        break
      case error.TIMEOUT:
        errorMessage = 'Location request timed out. Please try again.'
        break
      default:
        errorMessage = 'An unknown error occurred while getting location.'
        break
    }
    
    setLocationError(errorMessage)
    setIsLoading(false)
    
    const cachedLocation = localStorage.getItem('lastKnownLocation')
    if (cachedLocation) {
      try {
        const parsedLocation = JSON.parse(cachedLocation)
        // Only use cached location if it's less than 1 hour old
        if (Date.now() - parsedLocation.timestamp < 3600000) {
          setLocation(parsedLocation)
          setLocationError(`${errorMessage} Using last known location.`)
        }
      } catch (e) {
        // Invalid cached location, ignore
      }
    }
  }, [])

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser')
      return
    }

    setIsLoading(true)
    setLocationError(null)

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 15000, // 15 seconds
      maximumAge: 300000 // 5 minutes
    }

    navigator.geolocation.getCurrentPosition(
      handleLocationSuccess,
      handleLocationError,
      options
    )
  }, [handleLocationSuccess, handleLocationError])

  const watchLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser')
      return
    }

    // Clear existing watch if any
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
    }

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000, // 10 seconds
      maximumAge: 600000 // 10 minutes for watch
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      handleLocationSuccess,
      handleLocationError,
      options
    )
  }, [handleLocationSuccess, handleLocationError])

  const clearWatch = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
  }, [])

  // Load cached location on mount
  useEffect(() => {
    const cachedLocation = localStorage.getItem('lastKnownLocation')
    if (cachedLocation) {
      try {
        const parsedLocation = JSON.parse(cachedLocation)
        // Only use cached location if it's less than 1 hour old
        if (Date.now() - parsedLocation.timestamp < 3600000) {
          setLocation(parsedLocation)
        }
      } catch (e) {
        // Invalid cached location, ignore
      }
    }
  }, [])

  // Cleanup watch on unmount
  useEffect(() => {
    return () => {
      clearWatch()
    }
  }, [clearWatch])

  return {
    location,
    locationError,
    isLoading,
    requestLocation,
    watchLocation,
    clearWatch
  }
}