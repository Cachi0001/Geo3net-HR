import React, { useState, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react'
import { apiClient } from '@/services/api'
import { toast } from 'sonner'

type VerificationStatus = 'loading' | 'success' | 'error' | 'expired'

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState<VerificationStatus>('loading')
  const [email, setEmail] = useState('')
  const [isResending, setIsResending] = useState(false)
  const [token, setToken] = useState('')

  useEffect(() => {
    const verifyEmail = async () => {
      const tokenParam = searchParams.get('token')
      const emailParam = searchParams.get('email')
      
      if (!tokenParam) {
        setStatus('error')
        return
      }
      
      setToken(tokenParam)
      if (emailParam) {
        setEmail(decodeURIComponent(emailParam))
      }
      
      try {
        // Call the verify email endpoint
        const response = await fetch(`${apiClient.baseUrl}/auth/verify-email?token=${tokenParam}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        
        if (response.ok) {
          setStatus('success')
          toast.success('Email verified successfully!')
        } else {
          const errorData = await response.json()
          if (errorData.message?.includes('expired')) {
            setStatus('expired')
          } else {
            setStatus('error')
          }
        }
      } catch (error) {
        console.error('Email verification error:', error)
        setStatus('error')
      }
    }
    
    verifyEmail()
  }, [searchParams])

  const handleResendVerification = async () => {
    if (!email) {
      toast.error('Email address not found. Please register again.')
      return
    }
    
    setIsResending(true)
    try {
      const response = await fetch(`${apiClient.baseUrl}/auth/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })
      
      if (response.ok) {
        toast.success('Verification email sent! Please check your inbox.')
      } else {
        toast.error('Failed to resend verification email. Please try again.')
      }
    } catch (error) {
      console.error('Resend verification error:', error)
      toast.error('Failed to resend verification email. Please try again.')
    } finally {
      setIsResending(false)
    }
  }

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <Card className="shadow-lg border-0">
            <CardHeader className="space-y-1 text-center">
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
              </div>
              <CardTitle className="text-2xl">Verifying Your Email</CardTitle>
              <CardDescription>
                Please wait while we verify your email address...
              </CardDescription>
            </CardHeader>
          </Card>
        )
        
      case 'success':
        return (
          <Card className="shadow-lg border-0">
            <CardHeader className="space-y-1 text-center">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-2xl">Email Verified Successfully!</CardTitle>
              <CardDescription>
                Your email has been verified. You can now sign in to your account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/login">
                <Button className="w-full">
                  Continue to Sign In
                </Button>
              </Link>
            </CardContent>
          </Card>
        )
        
      case 'expired':
        return (
          <Card className="shadow-lg border-0">
            <CardHeader className="space-y-1 text-center">
              <div className="mx-auto w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                <Mail className="h-6 w-6 text-yellow-600" />
              </div>
              <CardTitle className="text-2xl">Verification Link Expired</CardTitle>
              <CardDescription>
                This verification link has expired. Please request a new verification email.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {email && (
                <div className="text-center text-sm text-gray-600">
                  <p>We'll send a new verification link to:</p>
                  <p className="font-medium">{email}</p>
                </div>
              )}
              
              <Button 
                onClick={handleResendVerification}
                disabled={isResending || !email}
                className="w-full"
              >
                {isResending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Resend Verification Email
                  </>
                )}
              </Button>
              
              <div className="text-center">
                <Link to="/register" className="text-sm text-primary hover:underline">
                  Register with a different email
                </Link>
              </div>
            </CardContent>
          </Card>
        )
        
      case 'error':
      default:
        return (
          <Card className="shadow-lg border-0">
            <CardHeader className="space-y-1 text-center">
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle className="text-2xl">Verification Failed</CardTitle>
              <CardDescription>
                We couldn't verify your email address. The link may be invalid or expired.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {email && (
                <Button 
                  onClick={handleResendVerification}
                  disabled={isResending}
                  variant="outline"
                  className="w-full"
                >
                  {isResending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Resend Verification Email
                    </>
                  )}
                </Button>
              )}
              
              <div className="flex flex-col space-y-2">
                <Link to="/register">
                  <Button variant="outline" className="w-full">
                    Register Again
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="ghost" className="w-full">
                    Back to Sign In
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <img 
              src="/logo.jpeg" 
              alt="Go3net Logo" 
              className="h-12 w-12 rounded-lg object-cover"
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Go3net</h1>
              <p className="text-sm text-gray-600">HR Management System</p>
            </div>
          </div>
        </div>

        {renderContent()}
      </div>
    </div>
  )
}

export default VerifyEmailPage