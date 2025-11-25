import { Bell, User } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '@/hooks/useAuth';
import { useAlerts } from '@/hooks/useEvents';

export default function TopBar() {
  const { user, logout } = useAuth();
  const { alerts } = useAlerts('open');

  return (
    <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6">
      <div className="flex-1" />

      <div className="flex items-center gap-4">
        <ThemeToggle />

        <button className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          <Bell size={20} />
          {alerts.length > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          )}
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-gray-200 dark:border-gray-700">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {user?.full_name || 'User'}
            </p>
            <button
              onClick={logout}
              className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            >
              Logout
            </button>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
            <User size={20} className="text-primary-600 dark:text-primary-400" />
          </div>
        </div>
      </div>
    </header>
  );
}
