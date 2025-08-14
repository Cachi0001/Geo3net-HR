import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import AttendanceHistory from '../../../components/timeTracking/AttendanceHistory/AttendanceHistory'
import { useApiCall } from '../../../hooks/useApiCall'
import { useToast } from '../../../hooks/useToast'

// Mock hooks
jest.mock('../../../hooks/useApiCall')
jest.mock('../../../hooks/useToast')

const mockApiCall = jest.fn()
const mockShowToast = jest.fn()

const mockAttendanceRecords = [
  {
    id: '1',
    date: '2024-01-15',
    checkIn: '2024-01-15T09:00:00Z',
    checkOut: '2024-01-15T17:30:00Z',
    totalHours: 8.5,
    status: 'present' as const,
    location: {
      checkIn: { latitude: 40.7128, longitude: -74.0060 },
      checkOut: { latitude: 40.7128, longitude: -74.0060 }
    }
  },
  {
    id: '2',
    date: '2024-01-14',
    checkIn: '2024-01-14T09:15:00Z',
    checkOut: '2024-01-14T17:00:00Z',
    totalHours: 7.75,
    status: 'late' as const
  },
  {
    id: '3',
    date: '2024-01-13',
    checkIn: null,
    checkOut: null,
    totalHours: 0,
    status: 'absent' as const
  }
]

const mockSummary = {
  totalDays: 20,
  presentDays: 18,
  absentDays: 2,
  partialDays: 0,
  totalHours: 144,
  averageHours: 8
}

describe('AttendanceHistory Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    ;(useApiCall as any).mockReturnValue({
      apiCall: mockApiCall
    })
    
    ;(useToast as any).mockReturnValue({
      showToast: mockShowToast
    })
  })

  it('renders loading state initially', () => {
    mockApiCall.mockImplementation(() => new Promise(() => {})) // Never resolves
    
    render(<AttendanceHistory />)
    
    expect(screen.getByText('Loading attendance history...')).toBeInTheDocument()
  })

  it('renders attendance records and summary correctly', async () => {
    mockApiCall
      .mockResolvedValueOnce({ data: mockAttendanceRecords })
      .mockResolvedValueOnce({ data: mockSummary })

    render(<AttendanceHistory />)

    await waitFor(() => {
      expect(screen.getByText('Attendance History')).toBeInTheDocument()
      expect(screen.getByText('18')).toBeInTheDocument() // Present days
      expect(screen.getByText('2')).toBeInTheDocument() // Absent days
      expect(screen.getByText('144h')).toBeInTheDocument() // Total hours
      expect(screen.getByText('8h')).toBeInTheDocument() // Average hours
    })

    // Check attendance records
    expect(screen.getByText('Mon, Jan 15')).toBeInTheDocument()
    expect(screen.getByText('9:00 AM')).toBeInTheDocument()
    expect(screen.getByText('5:30 PM')).toBeInTheDocument()
    expect(screen.getByText('8h 30m')).toBeInTheDocument()
    expect(screen.getByText('Present')).toBeInTheDocument()
  })

  it('handles empty attendance records', async () => {
    mockApiCall
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: mockSummary })

    render(<AttendanceHistory />)

    await waitFor(() => {
      expect(screen.getByText('No attendance records found')).toBeInTheDocument()
      expect(screen.getByText('No attendance data available for the selected period.')).toBeInTheDocument()
    })
  })

  it('changes period filter correctly', async () => {
    mockApiCall
      .mockResolvedValueOnce({ data: mockAttendanceRecords })
      .mockResolvedValueOnce({ data: mockSummary })

    render(<AttendanceHistory />)

    await waitFor(() => {
      expect(screen.getByDisplayValue('This Month')).toBeInTheDocument()
    })

    const periodSelect = screen.getByDisplayValue('This Month')
    fireEvent.change(periodSelect, { target: { value: 'last-month' } })

    await waitFor(() => {
      expect(mockApiCall).toHaveBeenCalledWith('/api/time-tracking/attendance?period=last-month', 'GET')
      expect(mockApiCall).toHaveBeenCalledWith('/api/time-tracking/attendance/summary?period=last-month', 'GET')
    })
  })

  it('switches between list and calendar view', async () => {
    mockApiCall
      .mockResolvedValueOnce({ data: mockAttendanceRecords })
      .mockResolvedValueOnce({ data: mockSummary })

    render(<AttendanceHistory />)

    await waitFor(() => {
      expect(screen.getByText('List')).toBeInTheDocument()
      expect(screen.getByText('Calendar')).toBeInTheDocument()
    })

    // Switch to calendar view
    const calendarButton = screen.getByText('Calendar')
    fireEvent.click(calendarButton)

    await waitFor(() => {
      expect(screen.getByText('Calendar View')).toBeInTheDocument()
      expect(screen.getByText('Calendar view will be implemented in the next phase')).toBeInTheDocument()
    })

    // Switch back to list view
    const listButton = screen.getByText('Switch to List View')
    fireEvent.click(listButton)

    await waitFor(() => {
      expect(screen.getByText('Mon, Jan 15')).toBeInTheDocument()
    })
  })

  it('displays different status badges correctly', async () => {
    mockApiCall
      .mockResolvedValueOnce({ data: mockAttendanceRecords })
      .mockResolvedValueOnce({ data: mockSummary })

    render(<AttendanceHistory />)

    await waitFor(() => {
      expect(screen.getByText('Present')).toBeInTheDocument()
      expect(screen.getByText('Late')).toBeInTheDocument()
      expect(screen.getByText('Absent')).toBeInTheDocument()
    })

    // Check status badge classes
    const presentBadge = screen.getByText('Present')
    const lateBadge = screen.getByText('Late')
    const absentBadge = screen.getByText('Absent')

    expect(presentBadge).toHaveClass('status-present')
    expect(lateBadge).toHaveClass('status-late')
    expect(absentBadge).toHaveClass('status-absent')
  })

  it('shows location indicators for records with GPS data', async () => {
    mockApiCall
      .mockResolvedValueOnce({ data: mockAttendanceRecords })
      .mockResolvedValueOnce({ data: mockSummary })

    render(<AttendanceHistory />)

    await waitFor(() => {
      const locationIndicators = screen.getAllByText('📍')
      expect(locationIndicators).toHaveLength(2) // Check-in and check-out for first record
    })
  })

  it('formats time and duration correctly', async () => {
    mockApiCall
      .mockResolvedValueOnce({ data: mockAttendanceRecords })
      .mockResolvedValueOnce({ data: mockSummary })

    render(<AttendanceHistory />)

    await waitFor(() => {
      expect(screen.getByText('9:00 AM')).toBeInTheDocument()
      expect(screen.getByText('5:30 PM')).toBeInTheDocument()
      expect(screen.getByText('8h 30m')).toBeInTheDocument()
      expect(screen.getByText('7h 45m')).toBeInTheDocument()
    })
  })

  it('handles missing check-in/check-out times', async () => {
    mockApiCall
      .mockResolvedValueOnce({ data: mockAttendanceRecords })
      .mockResolvedValueOnce({ data: mockSummary })

    render(<AttendanceHistory />)

    await waitFor(() => {
      // Check for absent record with no times
      const dashElements = screen.getAllByText('--')
      expect(dashElements.length).toBeGreaterThan(0)
    })
  })

  it('shows export options when records are available', async () => {
    mockApiCall
      .mockResolvedValueOnce({ data: mockAttendanceRecords })
      .mockResolvedValueOnce({ data: mockSummary })

    render(<AttendanceHistory />)

    await waitFor(() => {
      expect(screen.getByText('Export to CSV')).toBeInTheDocument()
      expect(screen.getByText('Generate Report')).toBeInTheDocument()
    })
  })

  it('hides export options when no records are available', async () => {
    mockApiCall
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: mockSummary })

    render(<AttendanceHistory />)

    await waitFor(() => {
      expect(screen.queryByText('Export to CSV')).not.toBeInTheDocument()
      expect(screen.queryByText('Generate Report')).not.toBeInTheDocument()
    })
  })

  it('handles API errors gracefully', async () => {
    mockApiCall.mockRejectedValue(new Error('Network error'))

    render(<AttendanceHistory />)

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith('error', 'Network error')
    })
  })

  it('formats duration for edge cases correctly', async () => {
    const edgeCaseRecords = [
      {
        id: '1',
        date: '2024-01-15',
        checkIn: '2024-01-15T09:00:00Z',
        checkOut: '2024-01-15T09:30:00Z',
        totalHours: 0.5,
        status: 'partial' as const
      },
      {
        id: '2',
        date: '2024-01-14',
        checkIn: '2024-01-14T09:00:00Z',
        checkOut: '2024-01-14T17:00:00Z',
        totalHours: 8,
        status: 'present' as const
      }
    ]

    mockApiCall
      .mockResolvedValueOnce({ data: edgeCaseRecords })
      .mockResolvedValueOnce({ data: mockSummary })

    render(<AttendanceHistory />)

    await waitFor(() => {
      expect(screen.getByText('30m')).toBeInTheDocument() // 0.5 hours
      expect(screen.getByText('8h')).toBeInTheDocument() // 8 hours exactly
    })
  })

  it('displays correct period options', async () => {
    mockApiCall
      .mockResolvedValueOnce({ data: mockAttendanceRecords })
      .mockResolvedValueOnce({ data: mockSummary })

    render(<AttendanceHistory />)

    await waitFor(() => {
      const periodSelect = screen.getByDisplayValue('This Month')
      fireEvent.click(periodSelect)
    })

    // Check if all period options are available
    const expectedOptions = [
      'This Week',
      'This Month', 
      'Last Month',
      'Last 3 Months',
      'This Year'
    ]

    expectedOptions.forEach(option => {
      expect(screen.getByText(option)).toBeInTheDocument()
    })
  })
})