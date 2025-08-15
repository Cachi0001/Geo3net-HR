import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import MobileCheckInOut from '../../../components/timeTracking/MobileCheckInOut/MobileCheckInOut'
import { useAuth } from '../../../hooks/useAuth'
import { useApiCall } from '../../../hooks/useApiCall'
import { useToast } from '../../../hooks/useToast'
import { useMobileLocation } from '../../../hooks/useMobileLocation'
import { useOfflineSync } from '../../../hooks/useOfflineSync'

// Mock hooks
jest.mock('../../../hooks/useAuth')
jest.mock('../../../hooks/useApiCall')
jest.mock('../../../hooks/useToast')
jest.mock('../../../hooks/useMobileLocation')
jest.mock('../../../hooks/useOfflineSync')

// Mock fullscreen API
Object.defineProperty(document, 'fullscreenElement', {
  writable: true,
  value: null
})

Object.defineProperty(document.documentElement, 'requestFullscreen', {
  writable: true,
  value: jest.fn()
})

Object.defineProperty(document, 'exitFullscreen', {
  writable: true,
  value: jest.fn()
})

const mockUser = {
  id: '1',
  fullName: 'John Doe',
  email: 'john@example.com',
  role: 'employee'
}

const mockLocation = {
  latitude: 40.7128,
  longitude: -74.0060,
  accuracy: 10,
  timestamp: Date.now()
}

const mockApiCall = jest.fn() as jest.MockedFunction<any>
const mockShowToast = jest.fn()
const mockRequestLocation = jest.fn()
const mockWatchLocation = jest.fn()
const mockClearWatch = jest.fn()
const mockQueueAction = jest.fn()
const mockSyncPendingActions = jest.fn() as jest.MockedFunction<any>

describe('MobileCheckInOut Component', () => {
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
    
    ;(useMobileLocation as any).mockReturnValue({
      location: mockLocation,
      locationError: null,
      isLoading: false,
      requestLocation: mockRequestLocation,
      watchLocation: mockWatchLocation,
      clearWatch: mockClearWatch
    })
    
    ;(useOfflineSync as any).mockReturnValue({
      isOnline: true,
      pendingActions: [],
      queueAction: mockQueueAction,
      syncPendingActions: mockSyncPendingActions,
      clearPendingActions: jest.fn()
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
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('renders loading state initially', () => {
    mockApiCall.mockImplementation(() => new Promise(() => {})) // Never resolves
    
    render(<MobileCheckInOut />)
    
    expect(screen.getByText('Loading check-in status...'))
  })

  it('renders online status correctly', async () => {
    mockApiCall.mockResolvedValue({
      data: { isCheckedIn: false, todayTotalHours: 0 }
    })

    render(<MobileCheckInOut />)

    await waitFor(() => {
      expect(screen.getByText('Online'))
      expect(screen.getByText('🟢'))
    })
  })

  it('renders offline status correctly', async () => {
    ;(useOfflineSync as any).mockReturnValue({
      isOnline: false,
      pendingActions: [{ id: '1', type: 'check-in' }],
      queueAction: mockQueueAction,
      syncPendingActions: mockSyncPendingActions,
      clearPendingActions: jest.fn()
    })

    mockApiCall.mockResolvedValue({
      data: { isCheckedIn: false, todayTotalHours: 0 }
    })

    render(<MobileCheckInOut />)

    await waitFor(() => {
      expect(screen.getByText('Offline'))
      expect(screen.getByText('🔴'))
      expect(screen.getByText('(1 pending)'))
    })
  })

  it('displays user greeting correctly', async () => {
    mockApiCall.mockResolvedValue({
      data: { isCheckedIn: false, todayTotalHours: 0 }
    })

    render(<MobileCheckInOut />)

    await waitFor(() => {
      expect(screen.getByText('Hello, John'))
    })
  })

  it('shows current time and updates every second', async () => {
    jest.useFakeTimers()
    
    mockApiCall.mockResolvedValue({
      data: { isCheckedIn: false, todayTotalHours: 0 }
    })

    render(<MobileCheckInOut />)

    await waitFor(() => {
      expect(screen.getByText(/\d{1,2}:\d{2}:\d{2}/))
    })

    const initialTime = screen.getByText(/\d{1,2}:\d{2}:\d{2}/).textContent

    // Advance time by 1 second
    jest.advanceTimersByTime(1000)

    await waitFor(() => {
      const updatedTime = screen.getByText(/\d{1,2}:\d{2}:\d{2}/).textContent
      expect(updatedTime).not.toBe(initialTime)
    })
  })

  it('renders checked out state correctly', async () => {
    mockApiCall.mockResolvedValue({
      data: { isCheckedIn: false, todayTotalHours: 0 }
    })

    render(<MobileCheckInOut />)

    await waitFor(() => {
      expect(screen.getByText('Ready to Check In'))
      expect(screen.getByText('Check In'))
      expect(screen.getByText('○'))
    })
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

    render(<MobileCheckInOut />)

    await waitFor(() => {
      expect(screen.getByText('Checked In'))
      expect(screen.getByText('Check Out'))
      expect(screen.getByText('✓'))
      expect(screen.getByText('Current Session'))
      expect(screen.getByText('Today\'s Total'))
    })
  })

  it('handles online check-in successfully', async () => {
    mockApiCall
      .mockResolvedValueOnce({ data: { isCheckedIn: false, todayTotalHours: 0 } })
      .mockResolvedValueOnce({ data: { success: true } })
      .mockResolvedValueOnce({ data: { isCheckedIn: true, lastCheckIn: new Date().toISOString() } })

    render(<MobileCheckInOut />)

    await waitFor(() => {
      expect(screen.getByText('Check In'))
    })

    const checkInButton = screen.getByText('Check In')
    fireEvent.click(checkInButton)

    await waitFor(() => {
      expect(mockApiCall).toHaveBeenCalledWith('/api/time-tracking/check-in', 'POST', expect.any(Object))
      expect(mockShowToast).toHaveBeenCalledWith('success', 'Successfully checked in!')
    })
  })

  it('handles offline check-in by queuing action', async () => {
    ;(useOfflineSync as any).mockReturnValue({
      isOnline: false,
      pendingActions: [],
      queueAction: mockQueueAction,
      syncPendingActions: mockSyncPendingActions,
      clearPendingActions: jest.fn()
    })

    // Mock localStorage for offline status
    (window.localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify({ isCheckedIn: false }))

    render(<MobileCheckInOut />)

    await waitFor(() => {
      expect(screen.getByText('Check In'))
    })

    const checkInButton = screen.getByText('Check In')
    fireEvent.click(checkInButton)

    await waitFor(() => {
      expect(mockQueueAction).toHaveBeenCalledWith(expect.objectContaining({
        type: 'check-in',
        synced: false
      }))
      expect(mockShowToast).toHaveBeenCalledWith('info', 'Checked in offline - will sync when online')
    })
  })

  it('shows location confirmation when available', async () => {
    mockApiCall.mockResolvedValue({
      data: { isCheckedIn: false, todayTotalHours: 0 }
    })

    render(<MobileCheckInOut />)

    await waitFor(() => {
      expect(screen.getByText(/Location confirmed/))
      expect(screen.getByText('📍'))
    })
  })

  it('shows location error when location fails', async () => {
    ;(useMobileLocation as any).mockReturnValue({
      location: null,
      locationError: 'Location access denied',
      isLoading: false,
      requestLocation: mockRequestLocation,
      watchLocation: mockWatchLocation,
      clearWatch: mockClearWatch
    })

    mockApiCall.mockResolvedValue({
      data: { isCheckedIn: false, todayTotalHours: 0 }
    })

    render(<MobileCheckInOut />)

    await waitFor(() => {
      expect(screen.getByText('Location Required'))
      expect(screen.getByText('Location access denied'))
      expect(screen.getByText('Retry'))
    })
  })

  it('retries location when retry button is clicked', async () => {
    ;(useMobileLocation as any).mockReturnValue({
      location: null,
      locationError: 'Location access denied',
      isLoading: false,
      requestLocation: mockRequestLocation,
      watchLocation: mockWatchLocation,
      clearWatch: mockClearWatch
    })

    mockApiCall.mockResolvedValue({
      data: { isCheckedIn: false, todayTotalHours: 0 }
    })

    render(<MobileCheckInOut />)

    await waitFor(() => {
      expect(screen.getByText('Retry'))
    })

    const retryButton = screen.getByText('Retry')
    fireEvent.click(retryButton)

    expect(mockRequestLocation).toHaveBeenCalled()
  })

  it('toggles fullscreen mode', async () => {
    mockApiCall.mockResolvedValue({
      data: { isCheckedIn: false, todayTotalHours: 0 }
    })

    render(<MobileCheckInOut />)

    await waitFor(() => {
      expect(screen.getByLabelText('Toggle fullscreen'))
    })

    const fullscreenButton = screen.getByLabelText('Toggle fullscreen')
    fireEvent.click(fullscreenButton)

    expect(document.documentElement.requestFullscreen).toHaveBeenCalled()
  })

  it('syncs pending actions when coming back online', async () => {
    const { rerender } = render(<MobileCheckInOut />)

    // Start offline with pending actions
    ;(useOfflineSync as any).mockReturnValue({
      isOnline: false,
      pendingActions: [{ id: '1', type: 'check-in' }],
      queueAction: mockQueueAction,
      syncPendingActions: mockSyncPendingActions,
      clearPendingActions: jest.fn()
    })

    rerender(<MobileCheckInOut />)

    // Come back online
    ;(useOfflineSync as any).mockReturnValue({
      isOnline: true,
      pendingActions: [{ id: '1', type: 'check-in' }],
      queueAction: mockQueueAction,
      syncPendingActions: mockSyncPendingActions.mockResolvedValue(null),
      clearPendingActions: jest.fn()
    })

    rerender(<MobileCheckInOut />)

    await waitFor(() => {
      expect(mockSyncPendingActions).toHaveBeenCalled()
    })
  })

  it('formats duration correctly', async () => {
    const checkInTime = new Date(Date.now() - 2.75 * 60 * 60 * 1000).toISOString() // 2h 45m ago
    mockApiCall.mockResolvedValue({
      data: {
        isCheckedIn: true,
        lastCheckIn: checkInTime,
        todayTotalHours: 8.5
      }
    })

    render(<MobileCheckInOut />)

    await waitFor(() => {
      expect(screen.getByText('8h 30m')) // Today's total
    })
  })

  it('disables check-in button when location is loading', async () => {
    ;(useMobileLocation as any).mockReturnValue({
      location: null,
      locationError: null,
      isLoading: true,
      requestLocation: mockRequestLocation,
      watchLocation: mockWatchLocation,
      clearWatch: mockClearWatch
    })

    mockApiCall.mockResolvedValue({
      data: { isCheckedIn: false, todayTotalHours: 0 }
    })

    render(<MobileCheckInOut />)

    await waitFor(() => {
      const checkInButton = screen.getByText('Check In')
      expect(checkInButton)
    })
  })

  it('shows refresh button and syncs when clicked', async () => {
    mockApiCall.mockResolvedValue({
      data: { isCheckedIn: false, todayTotalHours: 0 }
    })

    render(<MobileCheckInOut />)

    await waitFor(() => {
      expect(screen.getByText('Refresh'))
    })

    const refreshButton = screen.getByText('Refresh')
    fireEvent.click(refreshButton)

    expect(mockApiCall).toHaveBeenCalledWith('/api/time-tracking/status', 'GET')
  })
})
