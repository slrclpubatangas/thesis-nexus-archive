import { useState, useEffect } from 'react';

/**
 * Custom hook to track page visibility using the Page Visibility API
 * Returns the current visibility state and whether the page was just made visible
 */
export function usePageVisibility() {
    const [isVisible, setIsVisible] = useState(!document.hidden);
    const [justBecameVisible, setJustBecameVisible] = useState(false);

    useEffect(() => {
        const handleVisibilityChange = () => {
            const visible = !document.hidden;

            // If transitioning from hidden to visible
            if (visible && !isVisible) {
                setJustBecameVisible(true);
                // Reset the flag after a short delay
                setTimeout(() => setJustBecameVisible(false), 100);
            }

            setIsVisible(visible);
        };

        // Add event listener
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Cleanup
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [isVisible]);

    return { isVisible, justBecameVisible };
}
