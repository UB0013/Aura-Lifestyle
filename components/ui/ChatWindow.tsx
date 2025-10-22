import React, { useEffect, useRef } from 'react';
import type { CommunityMember, User } from '../../types';
import { Send, X } from 'lucide-react';

interface ChatWindowProps {
  member: CommunityMember;
  messages: { sender: string; text: string; type?: 'system' }[];
  inputValue: string;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSendMessage: (e: React.FormEvent) => void;
  onClose: () => void;
  currentUser: User;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  member,
  messages,
  inputValue,
  onInputChange,
  onSendMessage,
  onClose,
  currentUser
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="fixed bottom-4 right-4 w-full max-w-sm bg-gray-800 border border-gray-700 rounded-lg shadow-2xl flex flex-col z-50 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-700 bg-gray-900/50 rounded-t-lg">
        <div className="flex items-center space-x-3">
          <img src={member.avatarUrl} alt={member.name} className="w-8 h-8 rounded-full object-cover" />
          <h3 className="font-bold text-white">{member.name}</h3>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto h-80">
        {messages.map((msg, index) => {
          if (msg.type === 'system') {
            return (
              <div key={index} className="text-center my-2">
                <span className="text-xs text-indigo-200 bg-gray-700 px-3 py-1 rounded-full italic">
                  {msg.text}
                </span>
              </div>
            );
          }
          return (
            <div
              key={index}
              className={`flex items-end gap-2 ${msg.sender === currentUser.name ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender !== currentUser.name && (
                  <img src={member.avatarUrl} alt={member.name} className="w-6 h-6 rounded-full self-start"/>
              )}
              <div
                className={`max-w-xs px-3 py-2 rounded-lg ${
                  msg.sender === currentUser.name
                    ? 'bg-indigo-600 text-white rounded-br-none'
                    : 'bg-gray-700 text-gray-200 rounded-bl-none'
                }`}
              >
                <p className="text-sm break-words">{msg.text}</p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={onSendMessage} className="p-3 border-t border-gray-700 flex items-center space-x-2">
        <input
          type="text"
          value={inputValue}
          onChange={onInputChange}
          placeholder="Type a message..."
          className="flex-1 bg-gray-700 text-white placeholder-gray-400 px-3 py-2 rounded-lg border border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={!inputValue.trim()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-lg disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};

export default ChatWindow;