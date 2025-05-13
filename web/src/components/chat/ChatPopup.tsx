'use client';

import { useState, useEffect } from 'react';
import { useChatContext } from '@/contexts/chat-context';
import { ConversationList } from './ConversationList';
import { MessageInput } from './MessageInput';
import { FileMessage } from './FileMessage';
import { formatDistanceToNow } from 'date-fns';

export function ChatPopup() {
  const { messages, activeConversation, sendMessage, setActiveConversation, createConversation } = useChatContext();
  const [isMinimized, setIsMinimized] = useState(false);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [newConversationName, setNewConversationName] = useState('');
  const [newParticipants, setNewParticipants] = useState('');

  const currentMessages = activeConversation ? messages[activeConversation] || [] : [];

  const handleCreateConversation = () => {
    if (!newConversationName || !newParticipants) return;
    
    const participants = newParticipants.split(',').map(p => p.trim());
    createConversation(newConversationName, participants);
    
    setNewConversationName('');
    setNewParticipants('');
    setShowNewConversation(false);
  };

  return (
    <div 
      data-chat-popup
      className="fixed bottom-0 right-0 w-96 h-[600px] bg-white shadow-lg rounded-t-lg flex flex-col z-50 hidden"
    >
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between bg-gray-50 rounded-t-lg">
        <h2 className="text-lg font-semibold">Chat</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowNewConversation(!showNewConversation)}
            className="p-1 hover:bg-gray-200 rounded"
          >
            ➕
          </button>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:bg-gray-200 rounded"
          >
            {isMinimized ? '⬆️' : '⬇️'}
          </button>
          <button
            onClick={() => {
              const chatPopup = document.querySelector('[data-chat-popup]');
              if (chatPopup) {
                chatPopup.classList.add('hidden');
              }
            }}
            className="p-1 hover:bg-gray-200 rounded"
          >
            ✕
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* New Conversation Form */}
          {showNewConversation && (
            <div className="p-4 border-b">
              <input
                type="text"
                placeholder="Conversation Name"
                value={newConversationName}
                onChange={(e) => setNewConversationName(e.target.value)}
                className="w-full p-2 border rounded mb-2"
              />
              <input
                type="text"
                placeholder="Participants (comma-separated)"
                value={newParticipants}
                onChange={(e) => setNewParticipants(e.target.value)}
                className="w-full p-2 border rounded mb-2"
              />
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowNewConversation(false)}
                  className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateConversation}
                  className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Create
                </button>
              </div>
            </div>
          )}

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto">
            <ConversationList />
          </div>

          {/* Messages */}
          {activeConversation && (
            <div className="flex-1 overflow-y-auto p-4">
              {currentMessages.map((message) => (
                <div
                  key={message.id}
                  className={`mb-4 ${
                    message.senderId === 'current-user' ? 'ml-auto' : ''
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    <div className="w-8 h-8 rounded-full bg-gray-200" />
                    <div
                      className={`p-3 rounded-lg ${
                        message.senderId === 'current-user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-white'
                      }`}
                    >
                      <div className="text-sm text-gray-500">
                        {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
                      </div>
                      {message.type === 'file' && message.fileData ? (
                        <FileMessage
                          url={message.fileData.url}
                          fileName={message.fileData.fileName}
                          fileSize={message.fileData.fileSize}
                          fileType={message.fileData.fileType}
                          fileId={message.fileData.fileId}
                        />
                      ) : (
                        <div>{message.content}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Message Input */}
          {activeConversation && (
            <div className="p-4 border-t">
              <MessageInput />
            </div>
          )}
        </>
      )}
    </div>
  );
} 