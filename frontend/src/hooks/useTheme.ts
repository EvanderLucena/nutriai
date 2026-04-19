import { useEffect } from 'react';
import { useThemeStore } from '../stores/themeStore';

/**
 * Hook that ensures theme is applied on mount.
 * Returns theme state and toggle function for convenience.
 */
export function useTheme() {
  const { theme, toggleTheme, setTheme } = useThemeStore();

  useEffect(() => {
    // Ensure data-theme attribute is synced on mount
    const current = document.documentElement.getAttribute('data-theme');
    if (current !== theme) {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme]);

  return { theme, toggleTheme, setTheme };
}