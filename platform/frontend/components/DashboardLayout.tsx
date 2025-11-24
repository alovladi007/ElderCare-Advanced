'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';
import Link from 'next/link';

interface DashboardLayoutProps {
  children: ReactNode;
  allowedRoles?: string[];
}

export default function DashboardLayout({ children, allowedRoles }: DashboardLayoutProps) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    if (!loading && user && allowedRoles && !allowedRoles.includes(user.role)) {
      router.push('/unauthorized');
    }
  }, [user, loading, router, allowedRoles]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const navigation = [
    { name: 'Dashboard', href: `/dashboard/${user.role.toLowerCase()}` },
    { name: 'Profile', href: '/profile' },
  ];

  // Role-specific navigation
  if (user.role === 'ELDER') {
    navigation.push(
      { name: 'My Tasks', href: '/tasks' },
      { name: 'Medications', href: '/medications' },
      { name: 'Health', href: '/health' },
    );
  } else if (user.role === 'FAMILY') {
    navigation.push(
      { name: 'Loved Ones', href: '/elders' },
      { name: 'Alerts', href: '/alerts' },
      { name: 'Updates', href: '/updates' },
    );
  } else if (user.role === 'CAREGIVER' || user.role === 'CLINICIAN') {
    navigation.push(
      { name: 'Elders', href: '/elders' },
      { name: 'Tasks', href: '/tasks' },
      { name: 'Alerts', href: '/alerts' },
      { name: 'Care Plans', href: '/care-plans' },
    );
  } else if (user.role === 'ADMIN') {
    navigation.push(
      { name: 'Users', href: '/admin/users' },
      { name: 'System', href: '/admin/system' },
      { name: 'Reports', href: '/admin/reports' },
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="text-xl font-bold text-blue-600">
                ElderCare
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                {user.firstName} {user.lastName}
              </span>
              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                {user.role}
              </span>
              <button
                onClick={logout}
                className="text-sm text-gray-700 hover:text-gray-900"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Navigation tabs */}
        <div className="mb-6">
          <nav className="flex space-x-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md"
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>

        {/* Main content */}
        <main>
          <div className="px-4 py-6 sm:px-0">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
