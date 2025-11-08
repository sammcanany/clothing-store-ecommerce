import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/context/auth-context'

interface AccountModalProps {
  isOpen: boolean
  onClose: () => void
  onSignInClick: () => void
}

export default function AccountModal({ isOpen, onClose, onSignInClick }: AccountModalProps) {
  const mobileModalRef = useRef<HTMLDivElement>(null)
  const desktopModalRef = useRef<HTMLDivElement>(null)
  const { customer, logout } = useAuth()
  
  const isSignedIn = !!customer

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <>
      {/* Mobile: Full screen overlay */}
      <div 
        ref={mobileModalRef}
        className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={(e) => {
          // Close if clicking on the overlay (not the modal content)
          if (e.target === e.currentTarget) {
            onClose()
          }
        }}
      >
        <div 
          className="bg-white rounded-lg shadow-xl border border-neutral-200 overflow-hidden w-full max-w-md"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-neutral-200">
            <h3 className="text-lg font-semibold text-neutral-900">Account</h3>
            {isSignedIn && customer && (
              <p className="text-sm text-neutral-600 mt-1">{customer.email}</p>
            )}
          </div>

        {/* Content */}
        <div className="p-4">
          {!isSignedIn ? (
            <>
              {/* Sign In Button (when not signed in) */}
              <button 
                onClick={() => {
                  onSignInClick()
                }}
                className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-medium py-3 px-6 rounded-lg transition-colors mb-3"
              >
                Sign in
              </button>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                {/* Orders Button */}
                <Link
                  href="/orders"
                  onClick={onClose}
                  className="flex items-center justify-center gap-2 py-3 px-4 border-2 border-neutral-300 hover:border-neutral-400 rounded-lg transition-colors"
                >
                  <svg 
                    className="w-5 h-5 text-neutral-700" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" 
                    />
                  </svg>
                  <span className="font-medium text-neutral-900">Orders</span>
                </Link>

                {/* Profile Button */}
                <Link
                  href="/profile"
                  onClick={onClose}
                  className="flex items-center justify-center gap-2 py-3 px-4 border-2 border-neutral-300 hover:border-neutral-400 rounded-lg transition-colors"
                >
                  <svg 
                    className="w-5 h-5 text-neutral-700" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
                    />
                  </svg>
                  <span className="font-medium text-neutral-900">Profile</span>
                </Link>
              </div>
            </>
          ) : (
            <>
              {/* Action Buttons (when signed in, no Sign In button) */}
              <div className="grid grid-cols-2 gap-3">
                {/* Orders Button */}
                <Link
                  href="/orders"
                  onClick={onClose}
                  className="flex items-center justify-center gap-2 py-3 px-4 border-2 border-neutral-300 hover:border-neutral-400 rounded-lg transition-colors"
                >
                  <svg 
                    className="w-5 h-5 text-neutral-700" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" 
                    />
                  </svg>
                  <span className="font-medium text-neutral-900">Orders</span>
                </Link>

                {/* Profile Button */}
                <Link
                  href="/profile"
                  onClick={onClose}
                  className="flex items-center justify-center gap-2 py-3 px-4 border-2 border-neutral-300 hover:border-neutral-400 rounded-lg transition-colors"
                >
                  <svg 
                    className="w-5 h-5 text-neutral-700" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
                    />
                  </svg>
                  <span className="font-medium text-neutral-900">Profile</span>
                </Link>
              </div>

              {/* Sign Out Button (when signed in) */}
              <button 
                onClick={() => {
                  logout()
                  onClose()
                }}
                className="w-full mt-3 text-neutral-600 hover:text-neutral-900 text-sm font-medium py-2 transition-colors"
              >
                Sign out
              </button>
            </>
          )}
        </div>
      </div>
    </div>

      {/* Desktop: Dropdown from account icon */}
      <div 
        ref={desktopModalRef}
        className="hidden md:block absolute right-0 top-full mt-2 w-80 z-50"
      >
        <div 
          className="bg-white rounded-lg shadow-xl border border-neutral-200 overflow-hidden"
        >
          {/* Same content for desktop - will be duplicated but only one shows */}
          <div className="px-6 py-4 border-b border-neutral-200">
            <h3 className="text-lg font-semibold text-neutral-900">Account</h3>
            {isSignedIn && customer && (
              <p className="text-sm text-neutral-600 mt-1">{customer.email}</p>
            )}
          </div>

          <div className="p-4">
            {/* Copy the same content structure here */}
            {!isSignedIn ? (
              <>
                <button 
                  onClick={() => {
                    onSignInClick()
                  }}
                  className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-medium py-3 px-6 rounded-lg transition-colors mb-3"
                >
                  Sign in
                </button>

                <div className="grid grid-cols-2 gap-3">
                  <Link
                    href="/orders"
                    onClick={onClose}
                    className="flex items-center justify-center gap-2 py-3 px-4 border-2 border-neutral-300 hover:border-neutral-400 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    <span className="font-medium text-neutral-900">Orders</span>
                  </Link>

                  <Link
                    href="/profile"
                    onClick={onClose}
                    className="flex items-center justify-center gap-2 py-3 px-4 border-2 border-neutral-300 hover:border-neutral-400 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="font-medium text-neutral-900">Profile</span>
                  </Link>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    href="/orders"
                    onClick={onClose}
                    className="flex items-center justify-center gap-2 py-3 px-4 border-2 border-neutral-300 hover:border-neutral-400 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    <span className="font-medium text-neutral-900">Orders</span>
                  </Link>

                  <Link
                    href="/profile"
                    onClick={onClose}
                    className="flex items-center justify-center gap-2 py-3 px-4 border-2 border-neutral-300 hover:border-neutral-400 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="font-medium text-neutral-900">Profile</span>
                  </Link>
                </div>

                <button
                  onClick={() => {
                    logout()
                    onClose()
                  }}
                  className="w-full mt-3 text-neutral-600 hover:text-neutral-900 text-sm font-medium py-2 transition-colors"
                >
                  Sign out
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

