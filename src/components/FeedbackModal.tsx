import React, { useState } from 'react';
import { X, Star, Send } from 'lucide-react';

interface FeedbackModalProps {
  onClose: () => void;
  onSubmit: (feedback: { rating: number; comments: string }) => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ onClose, onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comments, setComments] = useState('');

  const handleFeedbackSubmit = () => {
    onSubmit({ rating, comments });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full relative transform transition-all duration-300 ease-in-out scale-95 hover:scale-100">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={24} />
        </button>

        <h3 className="text-2xl font-bold text-gray-800 mb-4">Submission Successful!</h3>
        <p className="text-gray-600 mb-6">Thank you for your contribution. Please rate your experience.</p>

        <div className="flex justify-center items-center mb-6 space-x-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              size={32}
              className={`cursor-pointer transition-all duration-200 ${ 
                (hoverRating || rating) >= star ? 'text-yellow-400 fill-current' : 'text-gray-300'
              }`}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(star)}
            />
          ))}
        </div>

        <textarea
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          placeholder="Share your feedback or suggestions..."
          className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-red-400 focus:ring-1 focus:ring-red-200 transition-all h-28 resize-none"
        />

        <div className="flex justify-end pt-6">
          <button
            onClick={handleFeedbackSubmit}
            disabled={rating === 0}
            className={`px-6 py-3 text-white font-semibold rounded-lg transition-all flex items-center space-x-2 ${
              rating === 0
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 shadow-md hover:shadow-lg'
            }`}
          >
            <Send size={20} />
            <span>Submit Feedback</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;
