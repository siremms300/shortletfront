'use client';

import { useState } from 'react';
import ReviewCard from './ReviewCard';
import AddReviewForm from './AddReviewForm';

interface Review {
  id: number;
  user: {
    name: string;
    image: string;
  };
  rating: number;
  comment: string;
  date: string;
  helpful: number;
}

interface ReviewsSectionProps {
  reviews: Review[];
  ratingBreakdown: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  averageRating: number;
  totalReviews: number;
  onAddReview: (review: Omit<Review, 'id' | 'helpful' | 'date'>) => void;
  onHelpfulClick: (reviewId: number) => void;
}

export default function ReviewsSection({
  reviews,
  ratingBreakdown,
  averageRating,
  totalReviews,
  onAddReview,
  onHelpfulClick
}: ReviewsSectionProps) {
  const [isReviewsOpen, setIsReviewsOpen] = useState(false);
  const [showAddReview, setShowAddReview] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'helpful' | 'highest' | 'lowest'>('recent');

  const sortedReviews = [...reviews].sort((a, b) => {
    switch (sortBy) {
      case 'recent':
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      case 'helpful':
        return b.helpful - a.helpful;
      case 'highest':
        return b.rating - a.rating;
      case 'lowest':
        return a.rating - b.rating;
      default:
        return 0;
    }
  });

  const getPercentage = (count: number) => {
    return totalReviews > 0 ? (count / totalReviews) * 100 : 0;
  };

  return (
    <div className="border border-gray-200 rounded-2xl bg-white">
      {/* Reviews Header - Accordion Trigger */}
      <button
        onClick={() => setIsReviewsOpen(!isReviewsOpen)}
        className="w-full px-6 py-4 flex justify-between items-center hover:bg-gray-50 transition duration-200 rounded-2xl"
      >
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <span className="text-2xl font-bold text-[#383a3c]">{averageRating}</span>
            <span className="text-[#f06123] text-xl ml-1">★</span>
          </div>
          <div className="text-left">
            <h3 className="text-lg font-semibold text-[#383a3c]">Reviews</h3>
            <p className="text-gray-600 text-sm">{totalReviews} review{totalReviews !== 1 ? 's' : ''}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <span className="text-gray-500 text-sm">
            {isReviewsOpen ? 'Hide reviews' : 'Show reviews'}
          </span>
          <svg
            className={`w-5 h-5 text-gray-400 transform transition duration-200 ${
              isReviewsOpen ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Reviews Content - Accordion Panel */}
      {isReviewsOpen && (
        <div className="px-6 pb-6 border-t border-gray-200">
          {/* Rating Summary */}
          <div className="py-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Rating Breakdown */}
              <div>
                <h4 className="font-semibold text-[#383a3c] mb-4">Rating Breakdown</h4>
                <div className="space-y-3">
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <div key={rating} className="flex items-center">
                      <span className="w-16 text-sm text-gray-600">{rating} star</span>
                      <div className="flex-1 mx-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#f06123] rounded-full transition-all duration-300"
                          style={{ width: `${getPercentage(ratingBreakdown[rating as keyof typeof ratingBreakdown])}%` }}
                        />
                      </div>
                      <span className="w-12 text-sm text-gray-600 text-right">
                        {ratingBreakdown[rating as keyof typeof ratingBreakdown]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add Review Button */}
              <div className="flex flex-col justify-center items-center lg:items-end space-y-4">
                <button
                  onClick={() => setShowAddReview(true)}
                  className="bg-[#f06123] text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition duration-200"
                >
                  Write a Review
                </button>
                <p className="text-gray-600 text-sm text-center lg:text-right">
                  Share your experience with this property
                </p>
              </div>
            </div>
          </div>

          {/* Sort Controls */}
          <div className="flex justify-between items-center mb-6 pt-4 border-t border-gray-200">
            <h4 className="text-lg font-semibold text-[#383a3c]">
              {sortedReviews.length} Review{sortedReviews.length !== 1 ? 's' : ''}
            </h4>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] text-sm"
            >
              <option value="recent">Most Recent</option>
              <option value="helpful">Most Helpful</option>
              <option value="highest">Highest Rated</option>
              <option value="lowest">Lowest Rated</option>
            </select>
          </div>

          {/* Reviews List */}
          <div className="space-y-6">
            {sortedReviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                onHelpfulClick={() => onHelpfulClick(review.id)}
              />
            ))}
          </div>

          {/* Load More Button */}
          {sortedReviews.length > 3 && (
            <div className="text-center mt-8 pt-6 border-t border-gray-200">
              <button className="border border-[#f06123] text-[#f06123] px-6 py-2 rounded-lg font-semibold hover:bg-[#f06123] hover:text-white transition duration-200">
                Load More Reviews
              </button>
            </div>
          )}

          {/* No Reviews Message */}
          {sortedReviews.length === 0 && (
            <div className="text-center py-8">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <h4 className="text-lg font-semibold text-gray-600 mb-2">No reviews yet</h4>
              <p className="text-gray-500 mb-4">Be the first to share your experience!</p>
              <button
                onClick={() => setShowAddReview(true)}
                className="bg-[#f06123] text-white px-6 py-2 rounded-lg font-semibold hover:bg-orange-600 transition duration-200"
              >
                Write First Review
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add Review Modal */}
      {showAddReview && (
        <AddReviewForm
          onClose={() => setShowAddReview(false)}
          onSubmit={onAddReview}
        />
      )}
    </div>
  );
}