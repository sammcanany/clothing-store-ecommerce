import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/context/auth-context'
import StarRating from './StarRating'

interface Review {
  id: string
  rating: number
  title?: string
  content?: string
  customer_name: string
  verified_purchase: boolean
  created_at: string
  helpful_count: number
}

interface ProductReviewsProps {
  productId: string
}

export default function ProductReviews({ productId }: ProductReviewsProps) {
  const { customer } = useAuth()
  const [reviews, setReviews] = useState<Review[]>([])
  const [averageRating, setAverageRating] = useState(0)
  const [totalReviews, setTotalReviews] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [rating, setRating] = useState(0)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetchReviews()
  }, [productId])

  const fetchReviews = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000'}/store/products/${productId}/reviews`,
        {
          headers: {
            'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || '',
          },
        }
      )
      if (response.ok) {
        const data = await response.json()
        setReviews(data.reviews || [])
        setAverageRating(data.average_rating || 0)
        setTotalReviews(data.total_reviews || 0)
      }
    } catch (err) {
      console.error('Failed to fetch reviews:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    if (!rating) {
      setError('Please select a rating')
      setIsSubmitting(false)
      return
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000'}/store/products/${productId}/reviews`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || '',
          },
          body: JSON.stringify({ rating, title, content }),
        }
      )

      if (response.ok) {
        setSuccess(true)
        setShowReviewForm(false)
        setRating(0)
        setTitle('')
        setContent('')
        fetchReviews() // Refresh reviews
        setTimeout(() => setSuccess(false), 3000)
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to submit review')
      }
    } catch (err) {
      setError('Failed to submit review')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold text-neutral-900 mb-6">Customer Reviews</h2>

      {/* Reviews Summary */}
      <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-6 mb-8">
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-neutral-900 mb-2">
              {averageRating.toFixed(1)}
            </div>
            <StarRating rating={averageRating} size="lg" />
            <div className="text-sm text-neutral-600 mt-2">
              Based on {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
            </div>
          </div>

          {customer ? (
            <button
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="ml-auto px-6 py-3 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors"
            >
              Write a Review
            </button>
          ) : (
            <div className="ml-auto text-neutral-600 text-sm">
              <a href="/signin" className="text-neutral-900 underline hover:text-neutral-700">
                Sign in
              </a>{' '}
              to write a review
            </div>
          )}
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
          Thank you! Your review has been submitted successfully.
        </div>
      )}

      {/* Review Form */}
      {showReviewForm && customer && (
        <div className="bg-white border border-neutral-200 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Write Your Review</h3>
          <form onSubmit={handleSubmitReview} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Rating *
              </label>
              <StarRating
                rating={rating}
                interactive
                onRatingChange={setRating}
                size="lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Review Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                placeholder="Sum up your experience"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Review
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                placeholder="Share your thoughts about this product"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors disabled:bg-neutral-400"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Review'}
              </button>
              <button
                type="button"
                onClick={() => setShowReviewForm(false)}
                className="px-6 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reviews List */}
      {isLoading ? (
        <div className="text-center py-12 text-neutral-600">Loading reviews...</div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-neutral-600 mb-4">No reviews yet</p>
          <p className="text-sm text-neutral-500">Be the first to review this product!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="border-b border-neutral-200 pb-6 last:border-0"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <StarRating rating={review.rating} size="sm" />
                    {review.verified_purchase && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                        Verified Purchase
                      </span>
                    )}
                  </div>
                  {review.title && (
                    <h4 className="font-semibold text-neutral-900 mb-1">{review.title}</h4>
                  )}
                  <p className="text-sm text-neutral-600">
                    {review.customer_name} •{' '}
                    {new Date(review.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              {review.content && (
                <p className="text-neutral-700 leading-relaxed">{review.content}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
