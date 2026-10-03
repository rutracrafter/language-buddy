import React from 'react';
import { useAuth } from '../context/AuthContext.js';
import { Headphones, LogOut, User } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, profile, logout } = useAuth();

  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Headphones className="w-5 h-5 text-slate-950 font-bold" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-white leading-tight">Language Buddy</h1>
            <p className="text-xs text-slate-400">Audio-First AI Tutor</p>
          </div>
        </div>

        {user && (
          <div className="flex items-center space-x-4">
            {profile && (
              <div className="hidden sm:flex items-center text-xs bg-slate-800 text-slate-300 px-3 py-1.5 rounded-full border border-slate-700">
                <span className="font-medium text-emerald-400 mr-1.5">{profile.targetLanguage}</span>
                <span className="text-slate-500">•</span>
                <span className="ml-1.5 text-slate-400">Level {profile.level?.overall || 'A1'}</span>
              </div>
            )}
            <div className="flex items-center text-sm text-slate-300 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700/60">
              <User className="w-4 h-4 mr-2 text-slate-400" />
              <span className="max-w-[150px] truncate">{user.email}</span>
            </div>
            <button
              onClick={logout}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
              title="Log out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
