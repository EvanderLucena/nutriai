import { Rail } from './Rail';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { Outlet } from 'react-router';
import { useRouteSync } from '../../hooks/useRouteSync';

export function AppShell() {
  useRouteSync();
  return (
    <div className="app">
      <Rail />
      <Sidebar />
      <div className="main">
        <Topbar />
        <div className="page">
          <Outlet />
        </div>
      </div>
    </div>
  );
}