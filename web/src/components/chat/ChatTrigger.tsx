'use client';

import { useChatContext } from '@/contexts/chat-context';

export function ChatTrigger() {
  const context = useChatContext();
  
  if (!context) {
    console.error('ChatTrigger: ChatContext is undefined');
    return null;
  }

  const { messages } = context;
  const unreadCount = messages?.filter(msg => msg.status !== 'read').length ?? 0;

  return (
    <button
      onClick={() => {
        const chatPopup = document.querySelector('[data-chat-popup]');
        if (chatPopup) {
          chatPopup.classList.remove('hidden');
        }
      }}
      className="fixed bottom-4 right-4 bg-blue-500 text-white p-3 rounded-full shadow-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    >
      <div className="relative">
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </div>
    </button>
  );
} 