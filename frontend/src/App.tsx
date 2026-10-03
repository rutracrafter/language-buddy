import React, { useState } from 'react';
import { useAuth } from './context/AuthContext.js';
import { Navbar } from './components/Navbar.js';
import { AuthPage } from './pages/AuthPage.js';
import { Dashboard } from './pages/Dashboard.js';
import { OnboardingFlow } from './components/onboarding/OnboardingFlow.js';
import { BUDDY_ASSETS } from './assets/buddyAssets.js';

export const AppContent: React.FC = () => {
  const { user, profile, isLoading, refresh } = useAuth();
  const [isReplayingOnboarding, setIsReplayingOnboarding] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF7F0] bg-sketchbook flex flex-col items-center justify-center p-6 text-[#2B2B2B]">
        <div className="w-20 h-20 rounded-full overflow-hidden shadow-md bg-orange-100 ring-2 ring-orange-300 mb-4 animate-gentle-float flex items-center justify-center">
          <img
            src={BUDDY_ASSETS.wavingHappy}
            alt="Buddy mascot"
            className="w-full h-full object-cover"
          />
        </div>
        <h2 className="font-display font-bold text-lg text-[#2B2B2B]">Language Buddy</h2>
        <p className="text-xs text-stone-500 mt-1">Connecting to your voice companion...</p>
      </div>
    );
  }

  // 1. User must sign in or register first
  if (!user) {
    return <AuthPage />;
  }

  // 2. Once registered/logged in: if onboarding not completed or user tapped replay from Settings
  const needsOnboarding = !profile?.onboardingCompletedAt || isReplayingOnboarding;
  if (needsOnboarding) {
    return (
      <OnboardingFlow
        onComplete={() => {
          setIsReplayingOnboarding(false);
          refresh();
        }}
      />
    );
  }

  // 3. Authenticated user with onboarding completed -> Home (Navbar + Dashboard)
  return (
    <div className="min-h-screen bg-[#FAF7F0] bg-sketchbook text-[#2B2B2B] flex flex-col antialiased">
      <Navbar onRestartOnboarding={() => setIsReplayingOnboarding(true)} />
      <main className="flex-1 flex flex-col">
        <Dashboard onRestartOnboarding={() => setIsReplayingOnboarding(true)} />
      </main>
    </div>
  );
};

export default function App() {
  return <AppContent />;
}
