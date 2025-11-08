import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Layout from '@/components/layout/Layout'
import SignInModal from '@/components/auth/SignInModal'
import { useAuth } from '@/lib/context/auth-context'

export default function SignInPage() {
  const router = useRouter()
  const { customer, isLoading } = useAuth()
  const { redirect } = router.query
  const [modalOpen, setModalOpen] = useState(true)

  useEffect(() => {
    console.log('SignIn page - isLoading:', isLoading, 'customer:', !!customer, 'redirect:', redirect)
    
    // Wait for auth to finish loading before redirecting
    if (!isLoading && customer) {
      const redirectPath = typeof redirect === 'string' ? redirect : '/'
      console.log('Redirecting to:', redirectPath)
      router.push(redirectPath)
    }
  }, [customer, isLoading, redirect, router])

  const handleClose = () => {
    // User closed modal without signing in, go to home
    setModalOpen(false)
    router.push('/')
  }

  return (
    <Layout>
      <div className="min-h-screen bg-neutral-50">
        <SignInModal 
          isOpen={modalOpen} 
          onClose={handleClose}
          redirectPath={typeof redirect === 'string' ? redirect : undefined}
        />
      </div>
    </Layout>
  )
}
