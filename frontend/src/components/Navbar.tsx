import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { LogOut } from 'lucide-react';
import { HandDrawnFlame, HandDrawnSettings } from './HandDrawnIcons.js';
import { SettingsModal } from './SettingsModal.js';
import { BUDDY_ASSETS } from '../assets/buddyAssets.js';

interface NavbarProps {
  onRestartOnboarding?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onRestartOnboarding }) => {
  const { user, profile, logout } = useAuth();
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      <header className="border-b border-stone-200/80 bg-[#FAF7F0]/95 bg-sketchbook backdrop-blur-md sticky top-0 z-20 pt-safe">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          {/* Logo / Mascot brand */}
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden shadow-xs ring-1.5 ring-orange-300 bg-orange-100 flex items-center justify-center flex-shrink-0">
              <img
                src={BUDDY_ASSETS.wavingHappy}
                alt="Buddy waving"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-display font-bold text-sm sm:text-base text-[#2B2B2B] leading-none">
                  Language Buddy
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <span className="text-[10px] text-stone-500 font-medium hidden xs:block">
                Voice Companion
              </span>
            </div>
          </div>

          {/* Right Controls */}
          {user && (
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Streak badge */}
              <div className="flex items-center gap-1 text-[11px] font-medium text-[#2B2B2B] bg-white/90 px-2.5 py-1 rounded-full shadow-xs border border-stone-200/60">
                <HandDrawnFlame size={14} washColor="#F97316" strokeColor="#2B2B2B" />
                <span className="font-bold text-[#2B2B2B]">{profile?.level?.overall || 'A1'}</span>
                <span className="text-stone-500 text-[10px] hidden sm:inline">
                  ({profile?.targetLanguage || 'Spanish'})
                </span>
              </div>

              {/* Settings button */}
              <button
                type="button"
                onClick={() => setShowSettings(true)}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/80 hover:bg-white active:scale-95 text-[#2B2B2B] flex items-center justify-center shadow-xs border border-stone-200/60 transition-all cursor-pointer"
                title="Settings & Preferences"
              >
                <HandDrawnSettings size={16} washColor="#FED7AA" strokeColor="#2B2B2B" />
              </button>

              {/* Logout button */}
              <button
                type="button"
                onClick={logout}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/80 hover:bg-rose-50 text-stone-500 hover:text-rose-600 flex items-center justify-center shadow-xs border border-stone-200/60 transition-all cursor-pointer"
                title="Log out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </header>

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onRestartOnboarding={() => {
          setShowSettings(false);
          onRestartOnboarding?.();
        }}
      />
    </>
  );
};
