import React, { RefObject } from 'react';
import { Loader2 } from 'lucide-react';
import { ChatMessage } from '@features/ai/hooks/useAIChat';

interface AIChatMessageListProps {
    messages: ChatMessage[];
    isLoading: boolean;
    messagesEndRef: RefObject<HTMLDivElement>;
}

const AIChatMessageList: React.FC<AIChatMessageListProps> = ({
    messages,
    isLoading,
    messagesEndRef,
}) => {
    return (
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 custom-scrollbar">
            {messages.map((message) => (
                <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                    <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm backdrop-blur-sm whitespace-pre-wrap ${message.role === 'user'
                            ? 'bg-blue-600 text-white rounded-br-none'
                            : 'bg-white/80 dark:bg-gray-800/80 text-gray-800 dark:text-gray-100 border border-white/60 dark:border-gray-700 rounded-bl-none'
                            }`}
                    >
                        {message.content}
                    </div>
                </div>
            ))}
            {isLoading && (
                <div className="flex justify-start">
                    <div className="flex items-center gap-2 rounded-2xl rounded-bl-none bg-white/80 dark:bg-gray-800/80 px-4 py-3 text-gray-700 dark:text-gray-200 border border-white/60 dark:border-gray-700">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Procesando con Gemini...</span>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>
    );
};

export default AIChatMessageList;
