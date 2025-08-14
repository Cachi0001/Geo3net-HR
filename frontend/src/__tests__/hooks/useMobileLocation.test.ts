import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { useMobileLocation } from '../../hooks/useMobileLocation'

// Mock geolocation
const mockGeolocation = {
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn()
}

Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true
})

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn()
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

describe('useMobileLocation Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  afterEach(() => {
    jest.clearAllTimers()
  })

  it('initializes with null location and no error', () => {
    const { result } = renderHook(() => useMobileLocation())

    expect(result.current.location).toBeNull()
    expect(result.current.locationError).toBeNull()
    expect(result.current.isLoading).toBe(false)
  })

  it('loads cached location on mount if valid', () => {
    const cachedLocation = {
      latitude: 40.7128,
      longitude: -74.0060,
      accuracy: 10,
      timestamp: Date.now() - 1000 // 1 second ago
    }

    localStorageMock.getItem.mockReturnValue(JSON.stringify(cachedLocation))

    const { result } = renderHook(() => useMobileLocation())

    expect(result.current.location).toEqual(cachedLocation)
  })

  it('ignores expired cached location', () => {
    const expiredLocation = {
      latitude: 40.7128,
      longitude: -74.0060,
      accuracy: 10,
      timestamp: Date.now() - 3700000 // More than 1 hour ago
    }

    localStorageMock.getItem.mockReturnValue(JSON.stringify(expiredLocation))

    const { result } = renderHook(() => useMobileLocation())

    expect(result.current.location).toBeNull()
  })

  it('requests location successfully', async () => {
    const mockPosition = {
      coords: {
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 10
      }
    }

    mockGeolocation.getCurrentPosition.mockImplementation((success: PositionCallback) => {
      success(mockPosition as GeolocationPosition)
    })

    const { result } = renderHook(() => useMobileLocation())

    act(() => {
      result.current.requestLocation()
    })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.location).toEqual({
      latitude: 40.7128,
      longitude: -74.0060,
      accuracy: 10,
      timestamp: expect.any(Number)
    })
    expect(result.current.locationError).toBeNull()
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'lastKnownLocation',
      expect.stringContaining('40.7128')
    )
  })

  it('handles location permission denied error', async () => {
    mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
      error({
        code: 1, // PERMISSION_DENIED
        message: 'Permission denied'
      })
    })

    const { result } = renderHook(() => useMobileLocation())

    act(() => {
      result.current.requestLocation()
    })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.location).toBeNull()
    expect(result.current.locationError).toBe(
      'Location access denied. Please enable location services in your browser settings.'
    )
  })

  it('handles location unavailable error', async () => {
    mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
      error({
        code: 2, // POSITION_UNAVAILABLE
        message: 'Position unavailable'
      })
    })

    const { result } = renderHook(() => useMobileLocation())

    act(() => {
      result.current.requestLocation()
    })

    expect(result.current.locationError).toBe(
      'Location information unavailable. Please check your GPS settings.'
    )
  })

  it('handles location timeout error', async () => {
    mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
      error({
        code: 3, // TIMEOUT
        message: 'Timeout'
      })
    })

    const { result } = renderHook(() => useMobileLocation())

    act(() => {
      result.current.requestLocation()
    })

    expect(result.current.locationError).toBe(
      'Location request timed out. Please try again.'
    )
  })

  it('uses cached location as fallback on error', async () => {
    const cachedLocation = {
      latitude: 40.7128,
      longitude: -74.0060,
      accuracy: 10,
      timestamp: Date.now() - 1000 // 1 second ago
    }

    localStorageMock.getItem.mockReturnValue(JSON.stringify(cachedLocation))

    mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
      error({
        code: 1, // PERMISSION_DENIED
        message: 'Permission denied'
      })
    })

    const { result } = renderHook(() => useMobileLocation())

    act(() => {
      result.current.requestLocation()
    })

    expect(result.current.location).toEqual(cachedLocation)
    expect(result.current.locationError).toContain('Using last known location')
  })

  it('starts watching location', () => {
    const watchId = 123
    mockGeolocation.watchPosition.mockReturnValue(watchId)

    const { result } = renderHook(() => useMobileLocation())

    act(() => {
      result.current.watchLocation()
    })

    expect(mockGeolocation.watchPosition).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
      expect.objectContaining({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 600000
      })
    )
  })

  it('clears existing watch before starting new one', () => {
    const watchId1 = 123
    const watchId2 = 456

    mockGeolocation.watchPosition
      .mockReturnValueOnce(watchId1)
      .mockReturnValueOnce(watchId2)

    const { result } = renderHook(() => useMobileLocation())

    act(() => {
      result.current.watchLocation()
    })

    act(() => {
      result.current.watchLocation()
    })

    expect(mockGeolocation.clearWatch).toHaveBeenCalledWith(watchId1)
    expect(mockGeolocation.watchPosition).toHaveBeenCalledTimes(2)
  })

  it('clears watch when clearWatch is called', () => {
    const watchId = 123
    mockGeolocation.watchPosition.mockReturnValue(watchId)

    const { result } = renderHook(() => useMobileLocation())

    act(() => {
      result.current.watchLocation()
    })

    act(() => {
      result.current.clearWatch()
    })

    expect(mockGeolocation.clearWatch).toHaveBeenCalledWith(watchId)
  })

  it('clears watch on unmount', () => {
    const watchId = 123
    mockGeolocation.watchPosition.mockReturnValue(watchId)

    const { result, unmount } = renderHook(() => useMobileLocation())

    act(() => {
      result.current.watchLocation()
    })

    unmount()

    expect(mockGeolocation.clearWatch).toHaveBeenCalledWith(watchId)
  })

  it('handles geolocation not supported', () => {
    // Temporarily remove geolocation
    const originalGeolocation = global.navigator.geolocation
    delete (global.navigator as any).geolocation

    const { result } = renderHook(() => useMobileLocation())

    act(() => {
      result.current.requestLocation()
    })

    expect(result.current.locationError).toBe('Geolocation is not supported by this browser')

    // Restore geolocation
    Object.defineProperty(global.navigator, 'geolocation', {
      value: originalGeolocation,
      writable: true
    })
  })

  it('sets loading state during location request', () => {
    let resolveLocation: (position: any) => void

    mockGeolocation.getCurrentPosition.mockImplementation((success: PositionCallback) => {
      resolveLocation = success
    })

    const { result } = renderHook(() => useMobileLocation())

    act(() => {
      result.current.requestLocation()
    })

    expect(result.current.isLoading).toBe(true)

    act(() => {
      resolveLocation({
        coords: {
          latitude: 40.7128,
          longitude: -74.0060,
          accuracy: 10
        }
      })
    })

    expect(result.current.isLoading).toBe(false)
  })
})