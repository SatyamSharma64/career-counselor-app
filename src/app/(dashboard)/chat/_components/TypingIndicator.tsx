import { Bot } from "lucide-react";

export const TypingIndicator: React.FC = () => {
  return (
    <div className="flex justify-start">
      <div className="flex items-end space-x-2">
        <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center">
          <Bot size={16} />
        </div>
        <div className="bg-gray-100 rounded-lg px-4 py-2">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
            <div 
              className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" 
              style={{ animationDelay: '0.2s' }}
            ></div>
            <div 
              className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" 
              style={{ animationDelay: '0.4s' }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};