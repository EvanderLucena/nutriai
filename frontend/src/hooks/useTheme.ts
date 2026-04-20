import { useEffect } from 'react';
import { useThemeStore } from '../stores/themeStore';

export function useTheme() {
  const { theme, toggleTheme, setTheme } = useThemeStore();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return { theme, toggleTheme, setTheme };
}