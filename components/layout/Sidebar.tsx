
import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, MessageSquare, BarChart2, UserCircle, X, Sparkles, Users, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (isCollapsed: boolean) => void;
}

const navItems = [
  { to: '/', text: 'Home', icon: Home },
  { to: '/chatbot', text: 'AI Companion', icon: MessageSquare },
  { to: '/lifestyle', text: 'Aura Life', icon: BarChart2 },
  { to: '/aura-report', text: 'Your Aura', icon: Sparkles },
  { to: '/community', text: 'Aura Community', icon: Users },
  { to: '/avatar', text: 'Avatar Studio', icon: UserCircle },
];

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen, isCollapsed, setIsCollapsed }) => {
  const NavItem = ({ to, text, icon: Icon }: typeof navItems[0]) => (
    <NavLink
      to={to}
      onClick={() => setIsOpen(false)}
      title={isCollapsed ? text : undefined}
      className={({ isActive }) =>
        `flex items-center px-4 py-3 rounded-lg transition-colors duration-200 ${
          isActive
            ? 'bg-indigo-600 text-white'
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'
        } ${isCollapsed ? 'justify-center' : ''}`
      }
    >
      <Icon className="w-5 h-5 shrink-0" />
      {!isCollapsed && <span className="ml-3">{text}</span>}
    </NavLink>
  );

  return (
    <>
      <div className={`fixed inset-0 bg-black/60 z-30 md:hidden transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsOpen(false)}></div>
      <aside className={`fixed top-0 left-0 h-full bg-gray-900 border-r border-gray-700 z-40 flex flex-col
        transform md:relative md:translate-x-0 transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        ${isCollapsed ? 'md:w-20' : 'md:w-64'}`}>
        
        <div className={`flex items-center h-[65px] border-b border-gray-700 p-4 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!isCollapsed && <span className="text-xl font-bold text-white">Aura Menu</span>}
           <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white md:hidden">
             <X size={24} />
           </button>
        </div>
        
        <nav className="flex-grow p-4 space-y-2">
          {navItems.map(item => (
            <NavItem key={item.to} {...item} />
          ))}
        </nav>
        
        <div className="border-t border-gray-700 p-4">
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)} 
            className="hidden md:flex items-center w-full p-2 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
            title={isCollapsed ? "Expand Menu" : "Collapse Menu"}
          >
            {isCollapsed 
                ? <ChevronsRight className="w-6 h-6 mx-auto" /> 
                : <>
                    <ChevronsLeft className="w-5 h-5 mr-3" />
                    <span className="text-sm">Collapse</span>
                  </>
            }
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;