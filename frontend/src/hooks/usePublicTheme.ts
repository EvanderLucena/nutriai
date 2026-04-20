import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { useThemeStore } from '../stores/themeStore';

export function usePublicTheme() {
  const { theme } = useThemeStore();
  const location = useLocation();

  const isPublicPage = ['/', '/login', '/signup', '/onboarding'].includes(location.pathname);

  useEffect(() => {
    if (isPublicPage) {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme, isPublicPage]);
}