import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { User, LearnerProfile } from '../types';
import { getApiBaseUrl } from '../constants/api';

const SESSION_TOKEN_KEY = 'lb_session_cookie';

interface AuthContextType {
  user: User | null;
  profile: LearnerProfile | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (
    email: string,
    password: string,
    nativeLanguage?: string,
    targetLanguage?: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<LearnerProfile>) => Promise<LearnerProfile>;
  refresh: () => Promise<void>;
  fetchWithAuth: (endpoint: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<LearnerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWithAuth = useCallback(async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
    const baseUrl = await getApiBaseUrl();
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${baseUrl}${cleanEndpoint}`;

    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    const savedToken = await SecureStore.getItemAsync(SESSION_TOKEN_KEY);
    if (savedToken) {
      headers['Cookie'] = `lb_session=${savedToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Check if new cookie was returned
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      const match = setCookie.match(/lb_session=([^;]+)/);
      if (match && match[1]) {
        await SecureStore.setItemAsync(SESSION_TOKEN_KEY, match[1]);
      }
    }

    return response;
  }, []);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const res = await fetchWithAuth('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setProfile(data.profile);
      } else {
        setUser(null);
        setProfile(null);
      }
    } catch (err) {
      console.log('Auth check note:', err);
      setUser(null);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, [fetchWithAuth]);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const res = await fetchWithAuth('/api/auth/me');
        if (res.ok && !ignore) {
          const data = await res.json();
          setUser(data.user);
          setProfile(data.profile);
        } else if (!ignore) {
          setUser(null);
          setProfile(null);
        }
      } catch {
        if (!ignore) {
          setUser(null);
          setProfile(null);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    })();
    return () => {
      ignore = true;
    };
  }, [fetchWithAuth]);

  const login = async (email: string, password: string) => {
    const res = await fetchWithAuth('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to log in');
    }

    setUser(data.user);
    setProfile(data.profile);
  };

  const signup = async (
    email: string,
    password: string,
    nativeLanguage = 'English',
    targetLanguage = 'Spanish'
  ) => {
    const res = await fetchWithAuth('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, nativeLanguage, targetLanguage }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to create account');
    }

    setUser(data.user);
    setProfile(data.profile);
  };

  const logout = async () => {
    try {
      await fetchWithAuth('/api/auth/logout', { method: 'POST' });
    } finally {
      await SecureStore.deleteItemAsync(SESSION_TOKEN_KEY);
      setUser(null);
      setProfile(null);
    }
  };

  const updateProfile = async (updates: Partial<LearnerProfile>): Promise<LearnerProfile> => {
    const res = await fetchWithAuth('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to update profile');
    }

    setProfile(data.profile);
    return data.profile;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        login,
        signup,
        logout,
        updateProfile,
        refresh: fetchCurrentUser,
        fetchWithAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
