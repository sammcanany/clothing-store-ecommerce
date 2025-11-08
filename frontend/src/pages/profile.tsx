import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Layout from '@/components/layout/Layout'
import { useAuth } from '@/lib/context/auth-context'
import AddressManagement from '@/components/account/AddressManagement'

export default function ProfilePage() {
  const { customer, isLoading: authLoading, logout } = useAuth()
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [addresses, setAddresses] = useState([])
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
  })

  useEffect(() => {
    // Don't redirect if auth is still loading
    if (authLoading) {
      return
    }

    // Redirect to sign-in page if not authenticated, with return URL
    if (!customer) {
      router.push('/signin?redirect=/profile')
      return
    }

    // User is authenticated, set form data
    setFormData({
      first_name: customer.first_name || '',
      last_name: customer.last_name || '',
      email: customer.email || '',
      phone: customer.phone || '',
    })

    // Fetch addresses
    fetchAddresses()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer, authLoading])

  const fetchAddresses = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000'}/store/customers/me/addresses`,
        {
          credentials: 'include',
          headers: {
            'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || '',
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        console.log('Addresses response:', data)
        setAddresses(data.addresses || [])
      }
    } catch (err) {
      console.error('Error fetching addresses:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000'}/store/customers/me`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || 'pk_01J9V1N0E0C8E1C1C1C1C1C1C1',
          },
          body: JSON.stringify({
            first_name: formData.first_name,
            last_name: formData.last_name,
            phone: formData.phone,
          }),
        }
      )

      if (response.ok) {
        setSuccess('Profile updated successfully!')
        setIsEditing(false)
        // Refresh customer data
        window.location.reload()
      } else {
        const data = await response.json()
        setError(data.message || 'Failed to update profile')
      }
    } catch (err) {
      setError('Failed to update profile')
      console.error('Error updating profile:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  if (authLoading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-neutral-600">Loading...</div>
          </div>
        </div>
      </Layout>
    )
  }

  if (!customer) {
    return null
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">My Profile</h1>
          <p className="text-neutral-600">Manage your account information</p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-600">{success}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
          <div className="bg-neutral-50 px-6 py-4 border-b border-neutral-200 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-neutral-900">Account Information</h2>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="text-neutral-600 hover:text-neutral-900 font-medium text-sm"
              >
                Edit
              </button>
            )}
          </div>

          <div className="px-6 py-6">
            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg bg-neutral-100 cursor-not-allowed"
                  />
                  <p className="text-xs text-neutral-500 mt-1">Email cannot be changed</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-300 text-white font-medium py-3 px-6 rounded-lg transition-colors"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false)
                      setError('')
                      setSuccess('')
                      // Reset form data
                      if (customer) {
                        setFormData({
                          first_name: customer.first_name || '',
                          last_name: customer.last_name || '',
                          email: customer.email || '',
                          phone: customer.phone || '',
                        })
                      }
                    }}
                    className="flex-1 bg-white hover:bg-neutral-50 border border-neutral-300 text-neutral-700 font-medium py-3 px-6 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-neutral-600 mb-1">First Name</p>
                    <p className="font-medium text-neutral-900">
                      {customer.first_name || 'Not set'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-600 mb-1">Last Name</p>
                    <p className="font-medium text-neutral-900">
                      {customer.last_name || 'Not set'}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-neutral-600 mb-1">Email</p>
                  <p className="font-medium text-neutral-900">{customer.email}</p>
                </div>

                <div>
                  <p className="text-sm text-neutral-600 mb-1">Phone</p>
                  <p className="font-medium text-neutral-900">
                    {customer.phone || 'Not set'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Address Management */}
        <div className="mt-8">
          <AddressManagement 
            customerId={customer.id} 
            addresses={addresses} 
            onUpdate={fetchAddresses}
          />
        </div>

        {/* Danger Zone */}
        <div className="mt-8 bg-white border border-red-200 rounded-lg overflow-hidden">
          <div className="bg-red-50 px-6 py-4 border-b border-red-200">
            <h2 className="text-xl font-semibold text-red-900">Danger Zone</h2>
          </div>
          <div className="px-6 py-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium text-neutral-900 mb-1">Sign Out</h3>
                <p className="text-sm text-neutral-600">Sign out of your account</p>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
