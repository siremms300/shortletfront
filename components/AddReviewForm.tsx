'use client';

import { useState } from 'react';

interface AddReviewFormProps {
  onClose: () => void;
  onSubmit: (review: { user: { name: string; image: string }; rating: number; comment: string }) => void;
}

export default function AddReviewForm({ onClose, onSubmit }: AddReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    if (rating === 0) {
      alert('Please select a rating');
      setIsSubmitting(false);
      return;
    }

    if (comment.trim().length < 10) {
      alert('Please write a review with at least 10 characters');
      setIsSubmitting(false);
      return;
    }

    // In a real app, you'd get this from the user's profile
    const user = {
      name: "Current User", // This would come from auth context
      image: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"
    };

    await onSubmit({
      user,
      rating,
      comment: comment.trim()
    });

    // Reset form and close
    setRating(0);
    setComment('');
    setIsSubmitting(false);
    onClose();
  };

  const renderStars = () => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            className="text-3xl focus:outline-none transition transform hover:scale-110 duration-200"
          >
            <span className={`
              ${star <= (hoverRating || rating) ? 'text-[#f06123]' : 'text-gray-300'}
              transition duration-200
            `}>
              ★
            </span>
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-semibold text-[#383a3c]">Write a Review</h3>
              <p className="text-gray-600 text-sm mt-1">Share your experience with this property</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition duration-200 p-2 rounded-lg hover:bg-gray-100"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Rating Section */}
            <div className="text-center">
              <label className="block text-lg font-medium text-gray-700 mb-4">
                How would you rate this property?
              </label>
              <div className="flex justify-center mb-2">
                {renderStars()}
              </div>
              <div className="text-sm text-gray-600">
                {rating > 0 && (
                  <span className="font-semibold">
                    {rating === 5 && 'Excellent! ✨'}
                    {rating === 4 && 'Very Good 👍'}
                    {rating === 3 && 'Good 😊'}
                    {rating === 2 && 'Fair 👌'}
                    {rating === 1 && 'Poor 👎'}
                  </span>
                )}
              </div>
            </div>

            {/* Comment Section */}
            <div>
              <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-3">
                Share your experience
              </label>
              <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-[#f06123] focus-within:border-transparent">
                <textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={6}
                  placeholder="What did you like about your stay? Was there anything that could be improved? Share details about the location, amenities, cleanliness, and host communication..."
                  className="w-full px-4 py-3 border-0 focus:outline-none focus:ring-0 resize-none"
                />
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>Be honest and specific to help other travelers</span>
                    <span>{comment.length}/500</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tips for Writing a Good Review */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Tips for a great review
              </h4>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>Describe what you loved about the property</li>
                <li>Mention the location and nearby amenities</li>
                <li>Share details about cleanliness and comfort</li>
                <li>Be honest about any issues you encountered</li>
              </ul>
            </div>
          </form>
        </div>

        {/* Footer with Actions */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition duration-200"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isSubmitting || rating === 0 || comment.length < 10}
              className="flex-1 bg-[#f06123] text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Submitting...
                </div>
              ) : (
                'Submit Review'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}