import { MessageRole } from "@prisma/client";
import { format } from "date-fns";
import { Bot, User } from "lucide-react";

interface MessageBubbleProps {
  content: string;
  role: MessageRole;
  timestamp: Date;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  content,
  role,
  timestamp,
}) => {
  const isUser = role === "USER";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`flex max-w-[80%] ${
          isUser ? "flex-row-reverse" : "flex-row"
        } items-end space-x-2`}
      >
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isUser
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-gray-600"
          }`}
        >
          {isUser ? <User size={16} /> : <Bot size={16} />}
        </div>

        <div
          className={`rounded-lg px-4 py-2 ${
            isUser
              ? "bg-blue-500 text-white"
              : "bg-gray-100 text-gray-900"
          }`}
        >
          <div className="whitespace-pre-wrap">{content}</div>
          <div
            className={`text-xs mt-1 ${
              isUser ? "text-blue-100" : "text-gray-500"
            }`}
          >
            {format(new Date(timestamp), "HH:mm")}
          </div>
        </div>
      </div>
    </div>
  );
};