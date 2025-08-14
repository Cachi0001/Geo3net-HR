import { renderHook, act } from '@testing-library/react'
import { AuthProvider, useAuth } from '../../contexts/AuthContext'
import { authService } from '../../services/auth.service'

// Mock the auth service
jest.mock('../../services/auth.service', () => ({
  authService: {
    login: jest.fn(),
    loginWithGoogle: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
    changePassword: jest.fn(),
    updateProfile: jest.fn(),
    getCurrentUser: jest.fn(),
  },
}))

const mockAuthService = authService as jest.Mocked<typeof authService>

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
})

describe('useAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
  })

  it('should throw error when used outside AuthProvider', () => {
    const { result } = renderHook(() => useAuth())
    
    expect(() => result.current).toThrow('useAuth must be used within an AuthProvider')
  })

  it('should initialize with no user when no token exists', async () => {
    mockLocalStorage.getItem.mockReturnValue(null)
    
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    })

    // Initially loading should be true
    expect(result.current.loading).toBe(true)
    expect(result.current.user).toBe(null)

    // Wait for initialization to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.user).toBe(null)
  })

  it('should initialize with user when valid token exists', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      fullName: 'Test User',
      role: 'employee',
      profileComplete: true,
    }

    mockLocalStorage.getItem.mockReturnValue('valid-token')
    mockAuthService.getCurrentUser.mockResolvedValue(mockUser)
    
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    })

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.user).toEqual(mockUser)
  })

  it('should handle login successfully', async () => {
    const mockLoginResponse = {
      user: {
        id: '1',
        email: 'test@example.com',
        fullName: 'Test User',
        role: 'employee',
        profileComplete: true,
      },
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    }

    mockAuthService.login.mockResolvedValue(mockLoginResponse)
    
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    })

    await act(async () => {
      await result.current.login('test@example.com', 'password')
    })

    expect(mockAuthService.login).toHaveBeenCalledWith('test@example.com', 'password')
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('accessToken', 'access-token')
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('refreshToken', 'refresh-token')
    expect(result.current.user).toEqual(mockLoginResponse.user)
  })

  it('should handle Google login successfully', async () => {
    const mockLoginResponse = {
      user: {
        id: '1',
        email: 'test@example.com',
        fullName: 'Test User',
        role: 'employee',
        profileComplete: true,
      },
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    }

    mockAuthService.loginWithGoogle.mockResolvedValue(mockLoginResponse)
    
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    })

    await act(async () => {
      await result.current.loginWithGoogle('google-token')
    })

    expect(mockAuthService.loginWithGoogle).toHaveBeenCalledWith('google-token')
    expect(result.current.user).toEqual(mockLoginResponse.user)
  })

  it('should handle registration successfully', async () => {
    const mockRegisterResponse = {
      user: {
        id: '1',
        email: 'test@example.com',
        fullName: 'Test User',
        role: 'employee',
        profileComplete: false,
      },
      message: 'Registration successful'
    }

    mockAuthService.register.mockResolvedValue(mockRegisterResponse)
    
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    })

    await act(async () => {
      await result.current.register({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'password'
      })
    })

    expect(mockAuthService.register).toHaveBeenCalledWith('test@example.com', 'Test User', 'password')
    expect(result.current.user).toEqual(mockRegisterResponse.user)
  })

  it('should handle logout successfully', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      fullName: 'Test User',
      role: 'employee',
      profileComplete: true,
    }

    // Set up initial user state
    mockLocalStorage.getItem.mockReturnValue('valid-token')
    mockAuthService.getCurrentUser.mockResolvedValue(mockUser)
    
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    })

    // Wait for initialization
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(result.current.user).toEqual(mockUser)

    // Perform logout
    await act(async () => {
      await result.current.logout()
    })

    expect(mockAuthService.logout).toHaveBeenCalled()
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('accessToken')
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('refreshToken')
    expect(result.current.user).toBe(null)
  })

  it('should handle forgot password', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    })

    await act(async () => {
      await result.current.forgotPassword('test@example.com')
    })

    expect(mockAuthService.forgotPassword).toHaveBeenCalledWith('test@example.com')
  })

  it('should handle reset password', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    })

    await act(async () => {
      await result.current.resetPassword('reset-token', 'new-password')
    })

    expect(mockAuthService.resetPassword).toHaveBeenCalledWith('reset-token', 'new-password')
  })

  it('should handle profile update', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      fullName: 'Test User',
      role: 'employee',
      profileComplete: true,
    }

    const updatedUser = {
      ...mockUser,
      fullName: 'Updated User',
    }

    // Set up initial user state
    mockLocalStorage.getItem.mockReturnValue('valid-token')
    mockAuthService.getCurrentUser.mockResolvedValue(mockUser)
    mockAuthService.updateProfile.mockResolvedValue(updatedUser)
    
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    })

    // Wait for initialization
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    // Update profile
    await act(async () => {
      await result.current.updateProfile({ fullName: 'Updated User' })
    })

    expect(mockAuthService.updateProfile).toHaveBeenCalledWith({ fullName: 'Updated User' })
    expect(result.current.user).toEqual(updatedUser)
  })
})