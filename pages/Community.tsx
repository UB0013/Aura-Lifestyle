import React, { useState } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import type { CommunityMember } from '../types';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import { Users, Share2, ArrowUpCircle, ArrowDownCircle, Sparkles, MessageSquare } from 'lucide-react';
import ChatWindow from '../components/ui/ChatWindow';

const initialCommunityMembers: CommunityMember[] = [
  {
    id: 1,
    name: 'Sarah J.',
    avatarUrl: 'https://picsum.photos/seed/sarah/100/100',
    status: 'Just finished a 5k run! Feeling energized for the week. ✨',
    auraScore: 88,
  },
  {
    id: 2,
    name: 'Mike R.',
    avatarUrl: 'https://picsum.photos/seed/mike/100/100',
    status: 'Took a break for some mindful breathing. It really helps clear the head.',
    auraScore: 72,
  },
  {
    id: 3,
    name: 'Chloe W.',
    avatarUrl: 'https://picsum.photos/seed/chloe/100/100',
    status: 'Trying out a new healthy recipe for dinner tonight. Wish me luck!',
    auraScore: 91,
  },
  {
    id: 4,
    name: 'David L.',
    avatarUrl: 'https://picsum.photos/seed/david/100/100',
    status: "Spent an hour reading a book instead of scrolling. Highly recommend!",
    auraScore: 65,
  },
  {
    id: 5,
    name: 'Emily T.',
    avatarUrl: 'https://picsum.photos/seed/emily/100/100',
    status: 'Grateful for the sunshine today. A long walk in the park was just what I needed.',
    auraScore: 85,
  },
  {
    id: 6,
    name: 'Jordan P.',
    avatarUrl: 'https://picsum.photos/seed/jordan/100/100',
    status: 'Starting a new journaling habit. Any tips for staying consistent?',
    auraScore: 79,
  },
];

type ChatMessage = {
  sender: string;
  text: string;
  type?: 'system';
};

const CommunityPage: React.FC = () => {
  const { auraScore, shareAura, auraShared, auraReceived, user } = useAppContext();
  const [members, setMembers] = useState<CommunityMember[]>(initialCommunityMembers);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<CommunityMember | null>(null);
  const [shareAmount, setShareAmount] = useState(1);
  const [error, setError] = useState('');

  // State for chat functionality
  const [activeChatMember, setActiveChatMember] = useState<CommunityMember | null>(null);
  const [allChatHistories, setAllChatHistories] = useState<Record<number, ChatMessage[]>>({});
  const [messageInput, setMessageInput] = useState('');

  const handleOpenModal = (member: CommunityMember) => {
    setSelectedMember(member);
    setShareAmount(1);
    setError('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedMember(null);
  };

  const handleConfirmShare = () => {
    if (!selectedMember) return;

    if (auraScore < shareAmount) {
      setError(`You don't have enough Aura to share. You only have ${auraScore}.`);
      return;
    }

    const success = shareAura(shareAmount);
    if (success) {
      setMembers(prevMembers =>
        prevMembers.map(m =>
          m.id === selectedMember.id
            ? { ...m, auraScore: m.auraScore + shareAmount }
            : m
        )
      );

      // Add system message to chat history for this member
      const systemMessage: ChatMessage = {
        sender: 'System',
        text: `You shared ${shareAmount} Aura with ${selectedMember.name}.`,
        type: 'system',
      };
      setAllChatHistories(prev => {
        const currentHistory = prev[selectedMember.id] || [];
        return {
          ...prev,
          [selectedMember.id]: [...currentHistory, systemMessage],
        };
      });

      handleCloseModal();
    } else {
      setError("An unexpected error occurred. Please try again.");
    }
  };
  
  const handleOpenChat = (member: CommunityMember) => {
    setActiveChatMember(member);
    if (!allChatHistories[member.id]) {
      setAllChatHistories(prev => ({ ...prev, [member.id]: [] }));
    }
    setMessageInput('');
  };

  const handleCloseChat = () => {
    setActiveChatMember(null);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeChatMember) return;

    const userMessage: ChatMessage = { sender: user.name, text: messageInput };
    
    setAllChatHistories(prev => {
        const currentHistory = prev[activeChatMember.id] || [];
        return {
          ...prev,
          [activeChatMember.id]: [...currentHistory, userMessage],
        };
    });

    setMessageInput('');
  };


  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center space-x-4">
          <Users size={40} className="text-indigo-400" />
          <div>
            <h1 className="text-3xl font-bold text-white">Aura Community</h1>
            <p className="text-gray-300 mt-1">Connect with and support fellow members on their wellness journey.</p>
          </div>
        </div>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="text-center p-4">
          <ArrowUpCircle className="mx-auto text-green-400" size={32} />
          <p className="mt-2 text-3xl font-bold text-white">{auraShared}</p>
          <p className="text-sm text-gray-400">Aura Shared</p>
        </Card>
        <Card className="text-center p-4">
          <ArrowDownCircle className="mx-auto text-indigo-400" size={32} />
          <p className="mt-2 text-3xl font-bold text-white">{auraReceived}</p>
          <p className="text-sm text-gray-400">Aura Received</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {members.map((member) => (
          <Card key={member.id} className="flex flex-col text-center items-center">
            <img 
              src={member.avatarUrl} 
              alt={`${member.name}'s avatar`} 
              className="w-24 h-24 rounded-full border-4 border-gray-600 object-cover mb-4"
            />
            <h2 className="text-xl font-semibold text-white">{member.name}</h2>
            <div className="bg-gray-900/50 rounded-full px-4 py-1 my-3 inline-flex items-center space-x-2">
                <Sparkles size={16} className="text-indigo-400" />
                <span className="font-bold text-indigo-300">{member.auraScore}</span>
                <span className="text-sm text-gray-400"> Aura</span>
            </div>
            <p className="text-gray-400 mt-2 text-sm flex-grow italic">"{member.status}"</p>
            <div className="mt-4 w-full flex space-x-2">
                <button
                onClick={() => handleOpenModal(member)}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors"
                >
                    <Share2 size={18} />
                    <span>Share Aura</span>
                </button>
                <button
                    onClick={() => handleOpenChat(member)}
                    title={`Chat with ${member.name}`}
                    className="bg-gray-600 hover:bg-gray-500 text-white font-bold p-3 rounded-lg flex items-center justify-center transition-colors"
                >
                    <MessageSquare size={18} />
                </button>
            </div>
          </Card>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={`Share Aura with ${selectedMember?.name || ''}`}>
        {selectedMember && (
          <div className="space-y-4 text-center">
            <p className="text-gray-300">Your current Aura Score: <span className="font-bold text-white">{auraScore}</span></p>
            <p className="text-sm text-gray-400">Select an amount to share.</p>
            
            <div className="flex justify-center space-x-2 my-4">
              {[1, 5, 10].map(amount => (
                <button 
                  key={amount} 
                  onClick={() => {
                    setShareAmount(amount);
                    setError('');
                  }}
                  className={`px-6 py-3 rounded-lg font-bold transition-colors text-lg ${shareAmount === amount ? 'bg-indigo-600 text-white ring-2 ring-indigo-400' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                >
                  {amount}
                </button>
              ))}
            </div>

            {error && <p className="text-red-400 text-center text-sm mb-2">{error}</p>}

            <button
              onClick={handleConfirmShare}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors disabled:bg-gray-500"
              disabled={auraScore < shareAmount}
            >
              <Share2 size={20}/>
              <span>Confirm & Share {shareAmount} Aura</span>
            </button>
          </div>
        )}
      </Modal>

    {/* Chat Window */}
      {activeChatMember && (
        <ChatWindow
          member={activeChatMember}
          messages={allChatHistories[activeChatMember.id] || []}
          inputValue={messageInput}
          onInputChange={(e) => setMessageInput(e.target.value)}
          onSendMessage={handleSendMessage}
          onClose={handleCloseChat}
          currentUser={user}
        />
      )}

    </div>
  );
};

export default CommunityPage;