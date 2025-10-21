import React from 'react';
import loadingGif from './idqktRTTZZ_1759196704064.gif';

interface LoadingSpinnerProps {
  size?: number;
  className?: string;
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 80, 
  className = '',
  message 
}) => {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <img 
        src={loadingGif} 
        alt="Loading..." 
        style={{ width: `${size}px`, height: `${size}px` }}
        className="object-contain"
      />
      {message && (
        <p className="text-gray-600 mt-2">{message}</p>
      )}
    </div>
  );
};

export default LoadingSpinner;
