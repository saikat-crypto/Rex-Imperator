import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { saveUserPreferences, loadUserPreferences } from '../utils/chatStorage';

export type ResponseLengthPreference = 'concise' | 'balanced' | 'long';
export type RichFormattingPreference = 'none' | 'slight' | 'balanced' | 'high';
export type EmojiPreference = 'none' | 'less' | 'balanced' | 'high';

export interface UserPreferences {
  responseLength: ResponseLengthPreference;
  visualElements: boolean;
  richFormatting: RichFormattingPreference;
  emojis: EmojiPreference;
}

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  responseLength: 'balanced',
  visualElements: true,
  richFormatting: 'balanced',
  emojis: 'balanced',
};

const BASE_PREFERENCES_KEY = 'usher_user_preferences';

interface PreferencesContextType {
  preferences: UserPreferences;
  updatePreference: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => void;
  resetPreferences: () => void;
  isSaved: boolean;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [isSaved, setIsSaved] = useState(true);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Helper to get local storage fallback key
  const getLocalKey = (userId?: string) =>
    userId ? `${BASE_PREFERENCES_KEY}_${userId}` : BASE_PREFERENCES_KEY;

  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    try {
      // On cold init, try to get local cached prefs for speed
      const activeKey = user?.userId ? getLocalKey(user.userId) : BASE_PREFERENCES_KEY;
      const saved = localStorage.getItem(activeKey) || localStorage.getItem(BASE_PREFERENCES_KEY);
      if (saved) {
        return { ...DEFAULT_USER_PREFERENCES, ...JSON.parse(saved) };
      }
    } catch {
      // Fallback
    }
    return DEFAULT_USER_PREFERENCES;
  });

  // When user logs in or changes: load their preferences from DynamoDB (cross-device source of truth)
  useEffect(() => {
    if (!user?.userId) return;

    // Start with localStorage cache for instant render, then hydrate from DynamoDB
    try {
      const localCached = localStorage.getItem(getLocalKey(user.userId));
      if (localCached) {
        setPreferences({ ...DEFAULT_USER_PREFERENCES, ...JSON.parse(localCached) });
      }
    } catch {
      // ignore
    }

    // Then hydrate from DynamoDB (overrides local if found)
    loadUserPreferences(user.userId).then((remote) => {
      if (remote) {
        setPreferences({ ...DEFAULT_USER_PREFERENCES, ...remote });
        // Sync DynamoDB value back to localStorage cache
        try {
          localStorage.setItem(getLocalKey(user.userId), JSON.stringify(remote));
        } catch {
          // ignore
        }
      }
    });
  }, [user?.userId]);

  const updatePreference = <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
    setPreferences((prev) => {
      const updated = { ...prev, [key]: value };

      // Write to localStorage immediately (instant, offline)
      try {
        localStorage.setItem(BASE_PREFERENCES_KEY, JSON.stringify(updated));
        if (user?.userId) {
          localStorage.setItem(getLocalKey(user.userId), JSON.stringify(updated));
        }
      } catch {
        // ignore
      }

      // Write to DynamoDB asynchronously (cross-device persistence)
      if (user?.userId) {
        saveUserPreferences(user.userId, updated).catch(() => {
          // silent — localStorage already saved it
        });
      }

      return updated;
    });

    setIsSaved(true);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      setIsSaved(true);
    }, 1500);
  };

  const resetPreferences = () => {
    setPreferences(DEFAULT_USER_PREFERENCES);
    try {
      localStorage.setItem(BASE_PREFERENCES_KEY, JSON.stringify(DEFAULT_USER_PREFERENCES));
      if (user?.userId) {
        localStorage.setItem(getLocalKey(user.userId), JSON.stringify(DEFAULT_USER_PREFERENCES));
        saveUserPreferences(user.userId, DEFAULT_USER_PREFERENCES).catch(() => {});
      }
    } catch {
      // ignore
    }
  };

  return (
    <PreferencesContext.Provider value={{ preferences, updatePreference, resetPreferences, isSaved }}>
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferences = (): PreferencesContextType => {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
};
