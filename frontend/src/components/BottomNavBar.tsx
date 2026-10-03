import React from 'react';
import {
  HandDrawnPhone,
  HandDrawnBook,
  HandDrawnUser,
  HandDrawnSettings,
} from './HandDrawnIcons.js';

export type NavTabType = 'practice' | 'history' | 'me' | 'settings';

interface BottomNavBarProps {
  activeTab: NavTabType;
  onTabChange: (tab: NavTabType) => void;
  className?: string;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  onTabChange,
  className = '',
}) => {
  return (
    <nav
      aria-label="Bottom Navigation"
      className={`fixed bottom-0 left-0 right-0 max-w-xl mx-auto bg-[#FAF7F0]/95 backdrop-blur-md border-t border-stone-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.04)] grid grid-cols-4 items-center z-30 pb-safe pt-2 select-none ${className}`}
    >
      {/* 1. Practice Tab */}
      <button
        type="button"
        onClick={() => onTabChange('practice')}
        className={`flex flex-col items-center justify-center py-1 cursor-pointer transition-colors group ${
          activeTab === 'practice' ? 'text-[#2B2B2B] font-bold' : 'text-stone-400 hover:text-[#2B2B2B]'
        }`}
      >
        <div className="h-7 flex items-center justify-center">
          <div
            className={`p-1 rounded-full transition-all ${
              activeTab === 'practice' ? 'bg-orange-100/90 scale-105 shadow-2xs' : 'group-hover:scale-105'
            }`}
          >
            <HandDrawnPhone
              size={18}
              washColor={activeTab === 'practice' ? '#86EFAC' : 'transparent'}
              strokeColor="#2B2B2B"
            />
          </div>
        </div>
        <span className="text-[10px] tracking-tight mt-0.5 font-semibold">Practice</span>
      </button>

      {/* 2. History Tab */}
      <button
        type="button"
        onClick={() => onTabChange('history')}
        className={`flex flex-col items-center justify-center py-1 cursor-pointer transition-colors group ${
          activeTab === 'history' ? 'text-[#2B2B2B] font-bold' : 'text-stone-400 hover:text-[#2B2B2B]'
        }`}
      >
        <div className="h-7 flex items-center justify-center">
          <div
            className={`p-1 rounded-full transition-all ${
              activeTab === 'history' ? 'bg-orange-100/90 scale-105 shadow-2xs' : 'group-hover:scale-105'
            }`}
          >
            <HandDrawnBook
              size={18}
              washColor={activeTab === 'history' ? '#FED7AA' : 'transparent'}
              strokeColor="#2B2B2B"
            />
          </div>
        </div>
        <span className="text-[10px] tracking-tight mt-0.5 font-semibold">History</span>
      </button>

      {/* 3. Me Profile Tab */}
      <button
        type="button"
        onClick={() => onTabChange('me')}
        className={`flex flex-col items-center justify-center py-1 cursor-pointer transition-colors group ${
          activeTab === 'me' ? 'text-[#2B2B2B] font-bold' : 'text-stone-400 hover:text-[#2B2B2B]'
        }`}
      >
        <div className="h-7 flex items-center justify-center">
          <div
            className={`p-1 rounded-full transition-all ${
              activeTab === 'me' ? 'bg-orange-100/90 scale-105 shadow-2xs' : 'group-hover:scale-105'
            }`}
          >
            <HandDrawnUser
              size={18}
              washColor={activeTab === 'me' ? '#BAE6FD' : 'transparent'}
              strokeColor="#2B2B2B"
            />
          </div>
        </div>
        <span className="text-[10px] tracking-tight mt-0.5 font-semibold">Me</span>
      </button>

      {/* 4. Settings Tab */}
      <button
        type="button"
        onClick={() => onTabChange('settings')}
        className={`flex flex-col items-center justify-center py-1 cursor-pointer transition-colors group ${
          activeTab === 'settings' ? 'text-[#2B2B2B] font-bold' : 'text-stone-400 hover:text-[#2B2B2B]'
        }`}
      >
        <div className="h-7 flex items-center justify-center">
          <div
            className={`p-1 rounded-full transition-all ${
              activeTab === 'settings' ? 'bg-orange-100/90 scale-105 shadow-2xs' : 'group-hover:scale-105'
            }`}
          >
            <HandDrawnSettings
              size={18}
              washColor={activeTab === 'settings' ? '#DDD6FE' : 'transparent'}
              strokeColor="#2B2B2B"
            />
          </div>
        </div>
        <span className="text-[10px] tracking-tight mt-0.5 font-semibold">Settings</span>
      </button>
    </nav>
  );
};
