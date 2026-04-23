import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createBrowserRouter, Navigate, Outlet, useLocation } from 'react-router';
import { useEffect } from 'react';
import { useAuthStore } from './stores/authStore';
import { usePublicTheme } from './hooks/usePublicTheme';
import { AppShell } from './components/shell/AppShell';
import { HomeView } from './views/HomeView';
import { PatientsView } from './views/PatientsView';
import { PatientView } from './views/PatientView';
import { FoodsView } from './views/FoodsView';
import { InsightsView } from './views/InsightsView';
import { LandingView } from './views/LandingView';
import { LoginView } from './views/LoginView';
import { SignupView } from './views/SignupView';
import { OnboardingView } from './views/OnboardingView';
import { Toast } from './components/ui/Toast';
import type { ReactNode } from 'react';

function AuthGuard({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isInitializing = useAuthStore((s) => s.isInitializing);
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  if (isInitializing) return null;

  if (!isAuthenticated || !user) return <Navigate to="/" replace />;

  if (!user.onboardingCompleted && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}

function RedirectIfAuthenticated({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isInitializing = useAuthStore((s) => s.isInitializing);
  const user = useAuthStore((s) => s.user);

  if (isInitializing) return null;

  if (isAuthenticated && user) {
    if (!user.onboardingCompleted) return <Navigate to="/onboarding" replace />;
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
}

function ThemeSync() {
  usePublicTheme();
  return <Outlet />;
}

function InitializeAuth() {
  const initializeAuth = useAuthStore((s) => s.initializeAuth);
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);
  return null;
}

const router = createBrowserRouter([
  {
    element: (
      <>
        <InitializeAuth />
        <ThemeSync />
      </>
    ),
    children: [
      { path: '/', element: <RedirectIfAuthenticated><LandingView /></RedirectIfAuthenticated> },
      { path: '/login', element: <RedirectIfAuthenticated><LoginView /></RedirectIfAuthenticated> },
      { path: '/signup', element: <RedirectIfAuthenticated><SignupView /></RedirectIfAuthenticated> },
      { path: '/onboarding', element: <AuthGuard><OnboardingView /></AuthGuard> },
      {
        element: <AuthGuard><AppShell /></AuthGuard>,
        children: [
          { path: '/home', element: <HomeView /> },
          { path: '/patients', element: <PatientsView /> },
          { path: '/patient/:id', element: <PatientView /> },
          { path: '/plans', element: <Navigate to="/patients" replace /> },
          { path: '/foods', element: <FoodsView /> },
          { path: '/insights', element: <InsightsView /> },
        ],
      },
    ],
  },
]);

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toast />
    </QueryClientProvider>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 2,
      staleTime: 2 * 60_000,
    },
  },
});