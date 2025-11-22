import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Play, ExternalLink, Volume2 } from 'lucide-react';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TutorialModal: React.FC<TutorialModalProps> = ({ isOpen, onClose }) => {
  // YouTube video embed URL
   const embedUrl = "https://www.youtube.com/embed/KP1gl1eqHG0?si=cu34eiFVbW7neIAe";
  const directUrl = "https://www.youtube.com/watch?v=KP1gl1eqHG0";
  
  // Force iframe reload when modal opens to ensure audio works
  const [iframeKey, setIframeKey] = useState(0);
  
  useEffect(() => {
    if (isOpen) {
      setIframeKey(prev => prev + 1);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full h-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-xl">
            <Play className="h-5 w-5 text-red-600" />
            <span>Video Tutorial</span>
          </DialogTitle>
          <DialogDescription>
            Learn how to use the LyceumVault system with this step-by-step tutorial.
          </DialogDescription>
        </DialogHeader>
        
        <div className="w-full">
          <div className="relative w-full pb-[56.25%] h-0 overflow-hidden rounded-lg border">
            <iframe
              key={iframeKey}
              src={embedUrl}
              className="absolute top-0 left-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
              title="YouTube video player"
              style={{ border: 'none' }}
            />
          </div>
          
          <div className="mt-4 space-y-4">
            {/* Audio troubleshooting message */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Volume2 className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Audio Issue?</span>
              </div>
              <p className="text-xs text-blue-700 mb-2">
                If you can't hear audio, try clicking the video to start playback, or use the direct link below.
              </p>
              <button
                onClick={() => window.open(directUrl, '_blank')}
                className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800 underline"
              >
                <ExternalLink className="h-3 w-3" />
                <span>Watch on YouTube with full audio</span>
              </button>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-sm text-gray-800 mb-2">Tutorial Overview:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• How to submit thesis documents</li>
                <li>• Searching and filtering submissions</li>
                <li>• Understanding the system features</li>
                <li>• Tips for effective document management</li>
              </ul>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TutorialModal;