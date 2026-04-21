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
import { PlansView } from './views/PlansView';
import { LandingView } from './views/LandingView';
import { LoginView } from './views/LoginView';
import { SignupView } from './views/SignupView';
import { OnboardingView } from './views/OnboardingView';
import type { ReactNode } from 'react';

function AuthGuard({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  if (!isAuthenticated || !user) return <Navigate to="/" replace />;

  // If authenticated but onboarding not completed, redirect to onboarding
  const location = useLocation();
  if (!user.onboardingCompleted && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}

function RedirectIfAuthenticated({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

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
          { path: '/plans', element: <PlansView /> },
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
    </QueryClientProvider>
  );
}

const queryClient = new QueryClient();