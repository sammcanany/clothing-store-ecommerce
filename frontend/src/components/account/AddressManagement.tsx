import { useState } from 'react'
import { Plus, Edit2, Trash2, MapPin } from 'lucide-react'

interface Address {
  id: string
  first_name?: string
  last_name?: string
  address_1: string
  address_2?: string
  city: string
  province: string
  postal_code: string
  country_code: string
  phone?: string
  company?: string
  address_name?: string
  is_default_shipping?: boolean
  is_default_billing?: boolean
}

interface AddressManagementProps {
  customerId: string
  addresses: Address[]
  onUpdate: () => void
}

export default function AddressManagement({ customerId, addresses, onUpdate }: AddressManagementProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<Partial<Address>>({
    country_code: 'US'
  })
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError('')

    try {
      const url = editingId
        ? `${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000'}/store/customers/me/addresses/${editingId}`
        : `${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000'}/store/customers/me/addresses`

      // Filter out read-only fields
      const { id, customer_id, created_at, updated_at, ...addressData } = formData as any

      console.log('Submitting address:', addressData)

      const response = await fetch(url, {
        method: editingId ? 'POST' : 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || '',
        },
        body: JSON.stringify(addressData),
      })

      if (response.ok) {
        setIsAdding(false)
        setEditingId(null)
        setFormData({ country_code: 'US' })
        onUpdate()
      } else {
        const data = await response.json()
        console.error('Address save error:', data)
        setError(data.message || 'Failed to save address')
      }
    } catch (err) {
      console.error('Address save exception:', err)
      setError('Failed to save address')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (addressId: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000'}/store/customers/me/addresses/${addressId}`,
        {
          method: 'DELETE',
          credentials: 'include',
          headers: {
            'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || '',
          },
        }
      )

      if (response.ok) {
        setDeleteConfirmId(null)
        onUpdate()
      } else {
        setError('Failed to delete address')
      }
    } catch (err) {
      setError('Failed to delete address')
    }
  }

  const startEdit = (address: Address) => {
    setEditingId(address.id)
    setFormData(address)
    setIsAdding(true)
  }

  const cancelEdit = () => {
    setIsAdding(false)
    setEditingId(null)
    setFormData({ type: 'shipping', country_code: 'US' })
    setError('')
  }

  return (
    <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
      <div className="bg-neutral-50 px-6 py-4 border-b border-neutral-200 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-neutral-900">Saved Addresses</h2>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 font-medium text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Address
          </button>
        )}
      </div>

      <div className="px-6 py-6">
        {/* Add/Edit Form */}
        {isAdding && (
          <form onSubmit={handleSubmit} className="mb-6 p-4 border border-neutral-200 rounded-lg bg-neutral-50">
            <h3 className="font-medium text-neutral-900 mb-4">
              {editingId ? 'Edit Address' : 'Add New Address'}
            </h3>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={formData.first_name || ''}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={formData.last_name || ''}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Street Address *
                </label>
                <input
                  type="text"
                  required
                  value={formData.address_1 || ''}
                  onChange={(e) => setFormData({ ...formData, address_1: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  placeholder="123 Main St"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Apartment, suite, etc.
                </label>
                <input
                  type="text"
                  value={formData.address_2 || ''}
                  onChange={(e) => setFormData({ ...formData, address_2: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  placeholder="Apt 4B"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.city || ''}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    State *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.province || ''}
                    onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    placeholder="CA"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    ZIP Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.postal_code || ''}
                    onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-300 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  {isSaving ? 'Saving...' : editingId ? 'Update Address' : 'Save Address'}
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="flex-1 bg-white hover:bg-neutral-50 border border-neutral-300 text-neutral-700 font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Address List */}
        {addresses.length === 0 && !isAdding ? (
          <div className="text-center py-8 text-neutral-600">
            <MapPin className="w-12 h-12 mx-auto mb-3 text-neutral-400" />
            <p>No saved addresses yet</p>
            <button
              onClick={() => setIsAdding(true)}
              className="mt-4 text-neutral-900 hover:underline font-medium"
            >
              Add your first address
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {addresses.map((address) => (
              <div
                key={address.id}
                className="p-4 border border-neutral-200 rounded-lg hover:border-neutral-300 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium px-2 py-1 bg-neutral-100 text-neutral-700 rounded">
                        {address.type || 'shipping'}
                      </span>
                      {address.is_default && (
                        <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-700 rounded">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="font-medium text-neutral-900">
                      {address.first_name} {address.last_name}
                    </p>
                    <p className="text-sm text-neutral-600 mt-1">
                      {address.address_1}
                      {address.address_2 && `, ${address.address_2}`}
                    </p>
                    <p className="text-sm text-neutral-600">
                      {address.city}, {address.province} {address.postal_code}
                    </p>
                    {address.phone && (
                      <p className="text-sm text-neutral-600 mt-1">{address.phone}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(address)}
                      className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(address.id)}
                      className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">Delete Address</h3>
            <p className="text-neutral-600 mb-6">
              Are you sure you want to delete this address? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
