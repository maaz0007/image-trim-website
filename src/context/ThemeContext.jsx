import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('imagetrim_theme');
    if (saved) return saved;
    // Default to light (Zapier's iconic warm cream style)
    return 'light';
  });

  useEffect(() => {
    localStorage.setItem('imagetrim_theme', theme);
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      document.body.classList.add('dark');
      root.classList.remove('light');
      document.body.classList.remove('light');
    } else {
      root.classList.remove('dark');
      document.body.classList.remove('dark');
      root.classList.add('light');
      document.body.classList.add('light');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
