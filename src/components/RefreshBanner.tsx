import React, { useEffect, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';

interface RefreshBannerProps {
    show: boolean;
    onDismiss: () => void;
    onRefresh: () => void;
}

const RefreshBanner: React.FC<RefreshBannerProps> = ({ show, onDismiss, onRefresh }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (show) {
            // Small delay for animation
            setTimeout(() => setIsVisible(true), 100);
        } else {
            setIsVisible(false);
        }
    }, [show]);

    if (!show) return null;

    return (
        <div
            className={`fixed top-0 left-0 right-0 z-50 transform transition-transform duration-300 ease-out ${isVisible ? 'translate-y-0' : '-translate-y-full'
                }`}
        >
            <div className="bg-blue-600 text-white px-4 py-3 shadow-lg">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <RefreshCw className="h-5 w-5 animate-spin" />
                        <div>
                            <p className="font-medium">Session Updated</p>
                            <p className="text-sm text-blue-100">
                                Please refresh the page to ensure you have the latest data
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={onRefresh}
                            className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors flex items-center space-x-2"
                        >
                            <RefreshCw className="h-4 w-4" />
                            <span>Refresh Now</span>
                        </button>
                        <button
                            onClick={onDismiss}
                            className="text-white hover:text-blue-100 transition-colors p-1"
                            aria-label="Dismiss"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RefreshBanner;
