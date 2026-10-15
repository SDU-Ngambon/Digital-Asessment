import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark' | 'aqua' | 'emerald' | 'midnight';

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('cbt_theme') as ThemeMode;
    return saved || 'light';
  });

  useEffect(() => {
    localStorage.setItem('cbt_theme', theme);
    const root = document.documentElement;

    root.classList.remove('dark', 'theme-aqua', 'theme-emerald', 'theme-midnight');

    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'aqua') {
      root.classList.add('theme-aqua');
    } else if (theme === 'emerald') {
      root.classList.add('dark', 'theme-emerald');
    } else if (theme === 'midnight') {
      root.classList.add('dark', 'theme-midnight');
    }
  }, [theme]);

  const toggleDarkMode = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
