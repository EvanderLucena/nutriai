import { RouterProvider, createBrowserRouter, Navigate, Outlet } from 'react-router';
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
  if (!isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function ThemeSync() {
  usePublicTheme();
  return <Outlet />;
}

const router = createBrowserRouter([
  {
    element: <ThemeSync />,
    children: [
      { path: '/', element: <LandingView /> },
      { path: '/login', element: <LoginView /> },
      { path: '/signup', element: <SignupView /> },
      { path: '/onboarding', element: <OnboardingView /> },
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
  return <RouterProvider router={router} />;
}