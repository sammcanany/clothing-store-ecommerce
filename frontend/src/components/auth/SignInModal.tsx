import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '@/lib/context/auth-context'
import ForgotPasswordModal from './ForgotPasswordModal'

interface SignInModalProps {
  isOpen: boolean
  onClose: () => void
  redirectPath?: string
}

export default function SignInModal({ isOpen, onClose, redirectPath }: SignInModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isNewUser, setIsNewUser] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const router = useRouter()
  const { login } = useAuth()

  // No click outside - only close button and ESC key

  // Close on Escape key and lock body scroll
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setError('')
    
    try {
      // Redirect to Google OAuth flow
      window.location.href = `${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000'}/auth/customer/google?callback_url=${window.location.origin}/auth/callback`
    } catch (err) {
      setError('Failed to connect to Google. Please try again.')
      setIsLoading(false)
    }
  }

  const handleEmailSignIn = async () => {
    if (!email) {
      setError('Please enter your email')
      return
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email')
      return
    }

    if (!showPassword) {
      // First step: show password field
      setShowPassword(true)
      return
    }

    if (!password) {
      setError('Please enter your password')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      if (isNewUser) {
        // Register new user
        await handleRegistration()
      } else {
        // Try to login
        await handleLogin()
      }
    } catch (err: any) {
      setIsLoading(false)
    }
  }

  const handleLogin = async () => {
    try {
      // Authenticate with Medusa
      const response = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000'}/auth/customer/emailpass`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // If login fails, might be a new user
        if (response.status === 401 || response.status === 400) {
          setIsNewUser(true)
          setError('Account not found. Enter your password to create a new account.')
          setIsLoading(false)
          return
        }
        throw new Error(data.message || 'Invalid email or password')
      }

      // Use auth context to handle login
      await login(data.token)

      // Success - close modal only if there's no redirect (user opened modal from a page, not from protected route)
      if (!redirectPath) {
        onClose()
      }
      setIsLoading(false)
    } catch (err: any) {
      setError(err.message || 'Invalid email or password')
      throw err
    }
  }

  const handleRegistration = async () => {
    try {
      // Step 1: Get registration token
      const registerTokenResponse = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000'}/auth/customer/emailpass/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      })

      const registerTokenData = await registerTokenResponse.json()

      if (!registerTokenResponse.ok) {
        throw new Error(registerTokenData.message || 'Registration failed')
      }

      // Step 2: Create customer account with the registration token
      const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || 'pk_01J9V1N0E0C8E1C1C1C1C1C1C1'
      
      const createCustomerResponse = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000'}/store/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${registerTokenData.token}`,
          'x-publishable-api-key': publishableKey,
        },
        body: JSON.stringify({
          email,
        }),
      })

      if (!createCustomerResponse.ok) {
        const errorData = await createCustomerResponse.json()
        throw new Error(errorData.message || 'Failed to create account')
      }

      // Step 3: Now login with the credentials
      await handleLogin()
    } catch (err: any) {
      setError(err.message || 'Failed to create account')
      throw err
    }
  }

  const handleReset = () => {
    setEmail('')
    setPassword('')
    setShowPassword(false)
    setIsNewUser(false)
    setError('')
    setIsLoading(false)
  }

  useEffect(() => {
    if (isOpen) {
      handleReset()
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div 
        ref={modalRef}
        className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden relative"
      >
        {/* Close Button - Now on the modal */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-neutral-100 rounded-full transition-colors z-10"
        >
          <svg
            className="w-5 h-5 text-neutral-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Header */}
        <div className="px-8 pt-8 pb-6 text-center border-b border-neutral-200">
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">
            Clothing Store
          </h2>
        </div>

        {/* Content */}
        <div className="px-8 py-6">
          <h3 className="text-xl font-semibold text-neutral-900 mb-2">
            {isNewUser ? 'Create Account' : 'Sign in'}
          </h3>
          <p className="text-sm text-neutral-600 mb-6">
            {showPassword 
              ? (isNewUser ? 'Choose a password (min 8 characters)' : 'Enter your password')
              : 'Enter your email to continue'}
          </p>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Email and Password Form */}
          <form onSubmit={(e) => {
            e.preventDefault()
            handleEmailSignIn()
          }}>
            {/* Email Input */}
            <div className="mb-4">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading || showPassword}
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent disabled:bg-neutral-100 disabled:cursor-not-allowed"
              />
            </div>

            {/* Password Input (shown after email) */}
            {showPassword && (
              <div className="mb-4">
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  autoFocus
                  className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent disabled:bg-neutral-100 disabled:cursor-not-allowed"
                />
                {!isNewUser && (
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-neutral-600 hover:text-neutral-900 mt-2"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
            )}

            {/* Continue/Sign In Button */}
            <button
              type="submit"
              disabled={isLoading || !email || (showPassword && !password)}
              className="w-full bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-300 disabled:text-neutral-500 text-white font-medium py-3 px-6 rounded-lg transition-colors mb-4"
            >
              {isLoading 
                ? 'Loading...' 
                : showPassword 
                  ? (isNewUser ? 'Create Account' : 'Sign in')
                  : 'Continue'}
            </button>
          </form>

          {/* Other sign-in methods */}
          {!showPassword && (
            <>
              {/* Divider */}
              <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-neutral-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-neutral-500">or</span>
                </div>
              </div>

              {/* Google Sign In */}
              <button
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full bg-white hover:bg-neutral-50 border border-neutral-300 text-neutral-700 font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>
            </>
          )}

          {/* Back button when showing password */}
          {showPassword && (
            <button
              onClick={() => {
                setShowPassword(false)
                setPassword('')
                setIsNewUser(false)
                setError('')
              }}
              disabled={isLoading}
              className="w-full text-neutral-600 hover:text-neutral-900 text-sm font-medium py-2 transition-colors"
            >
              ← Back to email
            </button>
          )}

          {/* Create account toggle */}
          {showPassword && !isNewUser && (
            <div className="mt-4 text-center">
              <p className="text-sm text-neutral-600">
                Don't have an account?{' '}
                <button
                  onClick={() => {
                    setIsNewUser(true)
                    setError('')
                  }}
                  disabled={isLoading}
                  className="text-neutral-900 font-medium hover:underline"
                >
                  Create one
                </button>
              </p>
            </div>
          )}

          {/* Sign in toggle */}
          {showPassword && isNewUser && (
            <div className="mt-4 text-center">
              <p className="text-sm text-neutral-600">
                Already have an account?{' '}
                <button
                  onClick={() => {
                    setIsNewUser(false)
                    setError('')
                  }}
                  disabled={isLoading}
                  className="text-neutral-900 font-medium hover:underline"
                >
                  Sign in
                </button>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal 
        isOpen={showForgotPassword} 
        onClose={() => setShowForgotPassword(false)} 
      />
    </div>
  )
}
