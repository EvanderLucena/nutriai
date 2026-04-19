import { RouterProvider, createBrowserRouter } from 'react-router';
import { useTheme } from './hooks/useTheme';
import { HomeView } from './views/HomeView';

const router = createBrowserRouter([
  {
    path: '/',
    element: <HomeView />,
  },
]);

function AppContent() {
  // Ensure theme is applied on mount
  useTheme();
  return <RouterProvider router={router} />;
}

export function App() {
  return <AppContent />;
}