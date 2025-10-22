import React from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { Menu, Sparkles } from 'lucide-react';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { user, auraScore } = useAppContext();

  return (
    <header className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-700">
      <div className="container mx-auto px-4 sm:px-6 py-3 flex justify-between items-center">
        <div className="flex items-center">
           <button onClick={onMenuClick} className="text-gray-400 hover:text-white md:hidden mr-4">
             <Menu size={24} />
           </button>
          <h1 className="text-xl font-bold text-white">Aura</h1>
        </div>
        <div className="flex items-center space-x-4">
          <div className="hidden sm:flex items-center space-x-2 bg-gray-700/50 px-3 py-1 rounded-full text-sm">
            <Sparkles size={16} className="text-indigo-400" />
            <span className="font-semibold text-white">{auraScore}</span>
            <span className="text-gray-400">Aura</span>
          </div>
          <span className="hidden sm:block text-gray-300">{user.name}</span>
          <img
            className="w-10 h-10 rounded-full border-2 border-indigo-500 object-cover"
            src={user.avatarUrl}
            alt="User Avatar"
          />
        </div>
      </div>
    </header>
  );
};

export default Header;