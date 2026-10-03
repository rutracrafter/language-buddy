import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { Headphones, LogOut, User, Settings } from 'lucide-react';
import { SettingsModal } from './SettingsModal.js';

export const Navbar: React.FC = () => {
  const { user, profile, logout } = useAuth();
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      <header className="border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md sticky top-0 z-20 pt-safe">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2.5 sm:space-x-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 flex-shrink-0">
              <Headphones className="w-4 h-4 sm:w-5 sm:h-5 text-slate-950 font-bold" />
            </div>
            <div>
              <h1 className="font-extrabold text-base sm:text-lg text-white leading-tight">Language Buddy</h1>
              <p className="text-[10px] sm:text-xs text-slate-400">Audio-First Voice Tutor</p>
            </div>
          </div>

          {user && (
            <div className="flex items-center space-x-1.5 sm:space-x-3">
              {profile && (
                <div className="flex items-center text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full border border-slate-700/80">
                  <span className="font-bold text-emerald-400 mr-1 max-w-[80px] sm:max-w-none truncate">
                    {profile.targetLanguage}
                  </span>
                  <span className="text-slate-500 hidden xs:inline">•</span>
                  <span className="ml-1 text-slate-400 font-semibold">{profile.level?.overall || 'A1'}</span>
                </div>
              )}
              <div className="hidden lg:flex items-center text-sm text-slate-300 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700/60">
                <User className="w-4 h-4 mr-2 text-slate-400" />
                <span className="max-w-[150px] truncate">{user.email}</span>
              </div>
              <button
                type="button"
                onClick={() => setShowSettings(true)}
                className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-emerald-400 active:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                title="Settings & Preferences"
              >
                <Settings className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={logout}
                className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-rose-400 active:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                title="Log out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </header>

      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </>
  );
};
