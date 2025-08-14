import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import CheckInOut from '../../../components/timeTracking/CheckInOut/CheckInOut'
import { useAuth } from '../../../hooks/useAuth'
import { useApiCall } from '../../../hooks/useApiCall'
import { useToast } from '../../../hooks/useToast'

// Mock hooks
jest.mock('../../../hooks/useAuth')
jest.mock('../../../hooks/useApiCall')
jest.mock('../../../hooks/useToast')

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

const mockUser = {
  id: '1',
  fullName: 'John Doe',
  email: 'john@example.com',
  role: 'employee'
}

const mockApiCall = jest.fn()
const mockShowToast = jest.fn()

describe('CheckInOut Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    ;(useAuth as any).mockReturnValue({
      user: mockUser
    })
    
    ;(useApiCall as any).mockReturnValue({
      apiCall: mockApiCall
    })
    
    ;(useToast as any).mockReturnValue({
      showToast: mockShowToast
    })

    // Mock successful geolocation
    mockGeolocation.getCurrentPosition.mockImplementation((success: PositionCallback) => {
      success({
        coords: {
          latitude: 40.7128,
          longitude: -74.0060,
          accuracy: 10
        }
      })
    })
  })

  it('renders loading state initially', () => {
    mockApiCall.mockImplementation(() => new Promise(() => {})) // Never resolves
    
    render(<CheckInOut />)
    
    expect(screen.getByText('Loading check-in status...')).toBeInTheDocument()
  })

  it('renders checked out state correctly', async () => {
    mockApiCall.mockResolvedValue({
      data: {
        isCheckedIn: false,
        todayTotalHours: 0
      }
    })

    render(<CheckInOut />)

    await waitFor(() => {
      expect(screen.getByText('Checked Out')).toBeInTheDocument()
      expect(screen.getByText('Check In')).toBeInTheDocument()
    })

    expect(screen.getByText(`Hello, ${mockUser.fullName}`)).toBeInTheDocument()
  })

  it('renders checked in state correctly', async () => {
    const checkInTime = new Date().toISOString()
    mockApiCall.mockResolvedValue({
      data: {
        isCheckedIn: true,
        lastCheckIn: checkInTime,
        todayTotalHours: 2.5
      }
    })

    render(<CheckInOut />)

    await waitFor(() => {
      expect(screen.getByText('Checked In')).toBeInTheDocument()
      expect(screen.getByText('Check Out')).toBeInTheDocument()
    })

    expect(screen.getByText('Current Session:')).toBeInTheDocument()
    expect(screen.getByText('2h 30m')).toBeInTheDocument()
  })

  it('handles check-in action successfully', async () => {
    mockApiCall
      .mockResolvedValueOnce({
        data: { isCheckedIn: false, todayTotalHours: 0 }
      })
      .mockResolvedValueOnce({ data: { success: true } })
      .mockResolvedValueOnce({
        data: { isCheckedIn: true, lastCheckIn: new Date().toISOString() }
      })

    render(<CheckInOut />)

    await waitFor(() => {
      expect(screen.getByText('Check In')).toBeInTheDocument()
    })

    const checkInButton = screen.getByText('Check In')
    fireEvent.click(checkInButton)

    await waitFor(() => {
      expect(mockApiCall).toHaveBeenCalledWith('/api/time-tracking/check-in', 'POST', expect.any(Object))
      expect(mockShowToast).toHaveBeenCalledWith('success', 'Successfully checked in!')
    })
  })

  it('handles check-out action successfully', async () => {
    const checkInTime = new Date().toISOString()
    mockApiCall
      .mockResolvedValueOnce({
        data: { isCheckedIn: true, lastCheckIn: checkInTime }
      })
      .mockResolvedValueOnce({ data: { success: true } })
      .mockResolvedValueOnce({
        data: { isCheckedIn: false, lastCheckOut: new Date().toISOString() }
      })

    render(<CheckInOut />)

    await waitFor(() => {
      expect(screen.getByText('Check Out')).toBeInTheDocument()
    })

    const checkOutButton = screen.getByText('Check Out')
    fireEvent.click(checkOutButton)

    await waitFor(() => {
      expect(mockApiCall).toHaveBeenCalledWith('/api/time-tracking/check-out', 'POST', expect.any(Object))
      expect(mockShowToast).toHaveBeenCalledWith('success', 'Successfully checked out!')
    })
  })

  it('handles location permission denied', async () => {
    mockGeolocation.getCurrentPosition.mockImplementation((success: PositionCallback, error: PositionErrorCallback) => {
      error({
        code: 1, // PERMISSION_DENIED
        message: 'Permission denied'
      } as GeolocationPositionError)
    })

    mockApiCall.mockResolvedValue({
      data: { isCheckedIn: false, todayTotalHours: 0 }
    })

    render(<CheckInOut />)

    await waitFor(() => {
      expect(screen.getByText('Location access denied. Please enable location services.')).toBeInTheDocument()
    })
  })

  it('shows location confirmation when available', async () => {
    mockApiCall.mockResolvedValue({
      data: { isCheckedIn: false, todayTotalHours: 0 }
    })

    render(<CheckInOut />)

    await waitFor(() => {
      expect(screen.getByText(/Location confirmed/)).toBeInTheDocument()
    })
  })

  it('handles API errors gracefully', async () => {
    mockApiCall.mockRejectedValue(new Error('Network error'))

    render(<CheckInOut />)

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith('error', 'Network error')
    })
  })

  it('formats time and duration correctly', async () => {
    const checkInTime = new Date('2024-01-01T09:00:00Z').toISOString()
    mockApiCall.mockResolvedValue({
      data: {
        isCheckedIn: true,
        lastCheckIn: checkInTime,
        todayTotalHours: 8.75
      }
    })

    render(<CheckInOut />)

    await waitFor(() => {
      expect(screen.getByText('8h 45m')).toBeInTheDocument()
    })
  })

  it('disables check-in button when location is not available', async () => {
    mockGeolocation.getCurrentPosition.mockImplementation((success: PositionCallback, error: PositionErrorCallback) => {
      error({
        code: 2, // POSITION_UNAVAILABLE
        message: 'Position unavailable'
      } as GeolocationPositionError)
    })

    mockApiCall.mockResolvedValue({
      data: { isCheckedIn: false, todayTotalHours: 0 }
    })

    render(<CheckInOut />)

    await waitFor(() => {
      const checkInButton = screen.getByText('Check In')
      expect(checkInButton).toBeDisabled()
    })
  })

  it('updates current time every second', async () => {
    jest.useFakeTimers()
    
    mockApiCall.mockResolvedValue({
      data: { isCheckedIn: false, todayTotalHours: 0 }
    })

    render(<CheckInOut />)

    const initialTime = screen.getByText(/\d{1,2}:\d{2}:\d{2}/)
    const initialTimeText = initialTime.textContent

    // Advance time by 1 second
    jest.advanceTimersByTime(1000)

    await waitFor(() => {
      const updatedTime = screen.getByText(/\d{1,2}:\d{2}:\d{2}/)
      expect(updatedTime.textContent).not.toBe(initialTimeText)
    })

    jest.useRealTimers()
  })
})