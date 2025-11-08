import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Layout from '@/components/layout/Layout'

export default function AuthCallback() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get query parameters from URL
        const { code, state, error: authError } = router.query

        if (authError) {
          setError('Authentication failed. Please try again.')
          setLoading(false)
          return
        }

        if (!code) {
          setError('No authorization code received.')
          setLoading(false)
          return
        }

        // Validate callback with Medusa
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000'}/auth/customer/google/callback?${new URLSearchParams(router.query as any)}`,
          {
            method: 'GET',
            credentials: 'include',
          }
        )

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || 'Authentication failed')
        }

        // Check if we got a token
        if (data.token) {
          // Store the JWT token
          localStorage.setItem('auth_token', data.token)

          // Create session
          const sessionResponse = await fetch(
            `${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000'}/auth/session`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${data.token}`,
              },
              credentials: 'include',
            }
          )

          if (!sessionResponse.ok) {
            throw new Error('Failed to create session')
          }

          // Redirect to home page
          router.push('/')
        } else {
          throw new Error('No token received')
        }
      } catch (err: any) {
        console.error('Auth callback error:', err)
        setError(err.message || 'Something went wrong during authentication')
        setLoading(false)
      }
    }

    // Only run when router is ready and has query params
    if (router.isReady) {
      handleCallback()
    }
  }, [router.isReady, router.query])

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900 mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold text-neutral-900 mb-2">
                Completing sign in...
              </h2>
              <p className="text-neutral-600">Please wait while we log you in.</p>
            </>
          ) : error ? (
            <>
              <div className="text-red-600 mb-4">
                <svg
                  className="w-16 h-16 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-neutral-900 mb-2">
                Authentication Failed
              </h2>
              <p className="text-neutral-600 mb-6">{error}</p>
              <button
                onClick={() => router.push('/')}
                className="bg-neutral-900 hover:bg-neutral-800 text-white font-medium py-2 px-6 rounded-lg transition-colors"
              >
                Return to Home
              </button>
            </>
          ) : null}
        </div>
      </div>
    </Layout>
  )
}
