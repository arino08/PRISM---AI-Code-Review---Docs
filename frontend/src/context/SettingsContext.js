'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { SessionProvider } from 'next-auth/react';

const SettingsContext = createContext();

export function SettingsProvider({ children }) {
  const [theme, setTheme] = useState('monochromatic'); // 'monochromatic', 'cyberpunk', 'midnight'
  const [openaiKey, setOpenaiKey] = useState('');

  // Load settings from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const savedKey = localStorage.getItem('openai_key');

    if (savedTheme) setTheme(savedTheme);
    if (savedKey) setOpenaiKey(savedKey);
  }, []);

  // Save settings
  const updateTheme = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    // You'd typically update CSS variables here based on theme
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const updateApiKey = (newKey) => {
    setOpenaiKey(newKey);
    localStorage.setItem('openai_key', newKey);
  };

  return (
    <SessionProvider>
      <SettingsContext.Provider value={{
        theme,
        updateTheme,
        openaiKey,
        updateApiKey
      }}>
        {children}
      </SettingsContext.Provider>
    </SessionProvider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
