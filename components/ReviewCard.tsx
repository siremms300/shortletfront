'use client';

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

interface ReviewCardProps {
  review: Review;
  onHelpfulClick: () => void;
}

export default function ReviewCard({ review, onHelpfulClick }: ReviewCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`text-sm ${
              star <= rating ? 'text-[#f06123]' : 'text-gray-300'
            }`}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      <div className="flex items-start space-x-3">
        <img
          src={review.user.image}
          alt={review.user.name}
          className="w-10 h-10 rounded-full flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex justify-between items-start mb-2">
            <div>
              <h4 className="font-semibold text-[#383a3c] text-sm">{review.user.name}</h4>
              <div className="flex items-center space-x-2 mt-1">
                {renderStars(review.rating)}
                <span className="text-gray-500 text-xs">{formatDate(review.date)}</span>
              </div>
            </div>
          </div>
          
          {/* Comment */}
          <p className="text-gray-700 text-sm leading-relaxed mb-3">{review.comment}</p>
          
          {/* Actions */}
          <div className="flex items-center space-x-4">
            <button
              onClick={onHelpfulClick}
              className="flex items-center space-x-1 text-gray-600 hover:text-[#f06123] transition duration-200 text-xs"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
              </svg>
              <span>Helpful ({review.helpful})</span>
            </button>
            
            <button className="flex items-center space-x-1 text-gray-600 hover:text-[#f06123] transition duration-200 text-xs">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>Reply</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}