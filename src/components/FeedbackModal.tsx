import React, { useState, useEffect, useMemo } from 'react';
import { X, Star, Send, AlertTriangle } from 'lucide-react';
import { profanity } from '@2toad/profanity';

interface FeedbackModalProps {
  onClose: () => void;
  onSubmit: (feedback: { rating: number; comments: string }) => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ onClose, onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comments, setComments] = useState('');
  const [hasProfanity, setHasProfanity] = useState(false);

  // Initialize profanity filter with custom Filipino/Tagalog words
  const filter = useMemo(() => {
    // Add custom Filipino/Tagalog profanity words
    const filipinoWords = [
      'putangina', 'putang ina', 'puta', 'tangina', 'tanga', 'gago', 'gaga',
      'bwiset', 'bwisit', 'leche', 'lintik', 'hayop ka', 'demonyo ka', 'ulol',
      'ogag', 'salot', 'punyeta', 'kupal', 'leche ka', 'hindot', 'kantot',
      'pukingina', 'pukeng ina', 'puking ina', 'burat', 'titi', 'pepe', 'puke',
      'puki', 'kantutan', 'kantutero', 'manyak', 'malibog', 'walang kwenta',
      'bobo', 'bobita', 'stupido', 'tanga-tanga', 'inutil', 'gago-gago',
      'tarantado', 'tarantada', 'hunghang', 'mangmang', 'lait', 'engot',
      'bwakangina', 'ungas', 'timang', 'mokong', 'leche puta', 'hayop na yan',
      'kiki', 'pekpek', 'etits', 'utong', 'bayag', 'itlog', 'tae mo', 'tae ka',
      'tae ka talaga', 'yawa', 'yati', 'demonyo', 'buang', 'bugo', 'kagwang',
      'animal ka', 'pabaga ug nawong', 'yawa ka', 'yati ka', 'pakyu', 'pakshet',
      'lintik ka', 'linti', 'bakakon', 'yawaon', 'baga-ug-nawong', 'ilaga ka',
      'totokar', 'p*ta', 'p0ta', 'p0tangina', 't4ngina', 'g4go', 'g@go',
      'bw1sit', 'l3che', 'put@', 'fakyu', 'fak u', 'p*k u', 't@ngina',
      'k*pal', 'bur*t', 'p*k!ng ina'
    ];

    // Add Filipino words to the profanity filter
    profanity.addWords(filipinoWords);

    return profanity;
  }, []);

  // Validate comments for profanity whenever they change
  useEffect(() => {
    if (comments.trim()) {
      setHasProfanity(filter.exists(comments));
    } else {
      setHasProfanity(false);
    }
  }, [comments, filter]);

  const handleFeedbackSubmit = () => {
    // Double-check for profanity before submission
    if (hasProfanity) {
      return;
    }
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
              className={`cursor-pointer transition-all duration-200 ${(hoverRating || rating) >= star ? 'text-yellow-400 fill-current' : 'text-gray-300'
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
          className={`w-full p-3 border-2 rounded-lg transition-all h-28 resize-none ${hasProfanity
            ? 'border-red-500 focus:border-red-600 focus:ring-1 focus:ring-red-300'
            : 'border-gray-200 focus:border-red-400 focus:ring-1 focus:ring-red-200'
            }`}
        />

        {/* Profanity Warning Message */}
        {hasProfanity && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2 text-left">
            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-800">Inappropriate Language Detected</p>
              <p className="text-xs text-red-700 mt-1">
                Please remove any offensive or inappropriate language from your feedback before submitting.
              </p>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-6">
          <button
            onClick={handleFeedbackSubmit}
            disabled={rating === 0 || hasProfanity}
            className={`px-6 py-3 text-white font-semibold rounded-lg transition-all flex items-center space-x-2 ${rating === 0 || hasProfanity
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
