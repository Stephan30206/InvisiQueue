import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Language } from './i18n';
import { useColorScheme } from 'react-native';

export type ColorScheme = 'light' | 'dark';

interface ThemeContextType {
  isDarkMode: boolean;
  colorScheme: ColorScheme;
  setIsDarkMode: (value: boolean) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [language, setLanguage] = useState<Language>('en');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const [savedDarkMode, savedLanguage] = await Promise.all([
        AsyncStorage.getItem('darkMode'),
        AsyncStorage.getItem('language'),
      ]);

      if (savedDarkMode !== null) {
        setIsDarkMode(JSON.parse(savedDarkMode));
      } else if (systemColorScheme) {
        setIsDarkMode(systemColorScheme === 'dark');
      }

      if (savedLanguage) {
        setLanguage(savedLanguage as Language);
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetIsDarkMode = async (value: boolean) => {
    try {
      setIsDarkMode(value);
      await AsyncStorage.setItem('darkMode', JSON.stringify(value));
    } catch (error) {
      console.error('Failed to save dark mode preference:', error);
    }
  };

  const handleSetLanguage = async (lang: Language) => {
    try {
      setLanguage(lang);
      await AsyncStorage.setItem('language', lang);
    } catch (error) {
      console.error('Failed to save language preference:', error);
    }
  };

  const toggleDarkMode = () => {
    handleSetIsDarkMode(!isDarkMode);
  };

  if (isLoading) {
    return <>{children}</>;
  }

  const colorScheme: ColorScheme = isDarkMode ? 'dark' : 'light';

  return (
    <ThemeContext.Provider
      value={{
        isDarkMode,
        colorScheme,
        setIsDarkMode: handleSetIsDarkMode,
        language,
        setLanguage: handleSetLanguage,
        toggleDarkMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export const themeColors = {
  light: {
    background: '#fafafa',
    surfaceLight: '#fff',
    text: '#111',
    textSecondary: '#555',
    textMuted: '#999',
    border: '#f0f0f0',
    borderLight: '#f5f5f5',
    icon: '#555',
    danger: '#e00',
    dangerBackground: '#fff0f0',
    tabBar: '#fff',
    tabBarBorder: '#f0f0f0',
  },
  dark: {
    background: '#0a0a0a',
    surfaceLight: '#1a1a1a',
    text: '#fff',
    textSecondary: '#e0e0e0',
    textMuted: '#999',
    border: '#2a2a2a',
    borderLight: '#333',
    icon: '#e0e0e0',
    danger: '#ff4444',
    dangerBackground: '#330000',
    tabBar: '#1a1a1a',
    tabBarBorder: '#2a2a2a',
  },
};

export const getThemeColors = (colorScheme: ColorScheme) => themeColors[colorScheme];
