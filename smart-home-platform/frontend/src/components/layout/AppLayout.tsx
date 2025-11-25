import { ReactNode } from 'react';
import SidebarNav from './SidebarNav';
import TopBar from './TopBar';
import { useUIStore } from '@/store/uiStore';

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <SidebarNav />
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
        <TopBar />
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
