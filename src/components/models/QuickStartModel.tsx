import { Sparkles, X } from "lucide-react";
import { Button } from "../ui/Button";
import { useEffect } from "react";

interface QuickStartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (title: string) => void;
  titles: string[];
}

export const QuickStartModal: React.FC<QuickStartModalProps> = ({ isOpen, onClose, onCreate, titles }) => {
  const handleTitleSelect = (title: string) => {
    onCreate(title);
    onClose();
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Quick Start Chat
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Choose from our suggested chat topics:
        </p>

        <div className="space-y-2 max-h-80 overflow-y-auto">
          {titles.map((title, index) => (
            <button
              key={index}
              onClick={() => handleTitleSelect(title)}
              className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <div className="flex items-center">
                <Sparkles className="w-4 h-4 mr-3 text-blue-500 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {title}
                </span>
              </div>
            </button>
          ))}
        </div>

        <div className="flex justify-end mt-6">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};
