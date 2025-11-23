/**
 * Unified Navigation Component
 * Works across React and Next.js applications
 *
 * Usage in React: <UnifiedNav router="react" />
 * Usage in Next.js: <UnifiedNav router="nextjs" />
 */

import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

interface NavLink {
  label: string;
  href: string;
  requiresAuth?: boolean;
  roles?: string[];
  external?: boolean;
}

interface UnifiedNavProps {
  router: 'react' | 'nextjs';
  customLinks?: NavLink[];
}

const defaultLinks: NavLink[] = [
  { label: 'Home', href: '/' },
  { label: 'Elder Care', href: '/elder-care' },
  { label: 'Smart Home', href: '/smart-home', requiresAuth: true },
  { label: 'Health Monitoring', href: '/health-monitoring', requiresAuth: true },
  { label: 'Dashboard', href: '/dashboard', requiresAuth: true },
  { label: 'Admin', href: '/admin', requiresAuth: true, roles: ['ADMIN'] },
];

export const UnifiedNav: React.FC<UnifiedNavProps> = ({
  router,
  customLinks,
}) => {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const links = customLinks || defaultLinks;

  // Filter links based on auth and roles
  const visibleLinks = links.filter((link) => {
    if (link.requiresAuth && !isAuthenticated) return false;
    if (link.roles && user && !link.roles.includes(user.role)) return false;
    return true;
  });

  const handleNavigation = (href: string, external?: boolean) => {
    if (external) {
      window.location.href = href;
      return;
    }

    if (router === 'react') {
      // For React Router, we'll use window.location for now
      // In actual implementation, use navigate from useNavigate
      window.location.hash = href;
    } else {
      // For Next.js, use window.location
      // In actual implementation, use router.push from next/navigation
      window.location.href = href;
    }
  };

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <button
              onClick={() => handleNavigation('/')}
              className="flex items-center space-x-2 cursor-pointer"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">EC</span>
              </div>
              <span className="text-xl font-bold text-gray-900">
                ElderCare Advanced
              </span>
            </button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {visibleLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => handleNavigation(link.href, link.external)}
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-100 transition-colors"
              >
                {link.label}
              </button>
            ))}

            {/* Auth Section */}
            {isAuthenticated && user ? (
              <div className="flex items-center space-x-4 ml-4 pl-4 border-l border-gray-300">
                <div className="text-sm">
                  <div className="font-medium text-gray-900">
                    {user.firstName} {user.lastName}
                  </div>
                  <div className="text-xs text-gray-500">{user.role}</div>
                </div>
                <button
                  onClick={logout}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2 ml-4 pl-4 border-l border-gray-300">
                <button
                  onClick={() => handleNavigation('/login')}
                  className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm font-medium"
                >
                  Login
                </button>
                <button
                  onClick={() => handleNavigation('/register')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Register
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {mobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {visibleLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => {
                  handleNavigation(link.href, link.external);
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-100"
              >
                {link.label}
              </button>
            ))}

            {/* Mobile Auth Section */}
            <div className="border-t border-gray-200 pt-4 mt-4">
              {isAuthenticated && user ? (
                <>
                  <div className="px-3 py-2">
                    <div className="text-base font-medium text-gray-900">
                      {user.firstName} {user.lastName}
                    </div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Role: {user.role}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full mt-2 px-3 py-2 text-left text-base font-medium text-red-600 hover:bg-red-50 rounded-md"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      handleNavigation('/login');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left text-base font-medium text-blue-600 hover:bg-blue-50 rounded-md"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => {
                      handleNavigation('/register');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left text-base font-medium bg-blue-600 text-white hover:bg-blue-700 rounded-md"
                  >
                    Register
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

/**
 * Quick Access Menu - shows links to all services
 */
interface QuickAccessProps {
  onNavigate?: (path: string) => void;
}

export const QuickAccessMenu: React.FC<QuickAccessProps> = ({ onNavigate }) => {
  const { user } = useAuth();

  const services = [
    { name: 'Main Portal', path: '/', icon: '🏠', color: 'bg-blue-500' },
    { name: 'Smart Home', path: '/elders', icon: '🏡', color: 'bg-green-500', nextjs: true },
    { name: 'Health Monitor', path: '/monitoring/dashboard', icon: '❤️', color: 'bg-red-500', react: true },
    { name: 'Admin Panel', path: '/admin', icon: '⚙️', color: 'bg-purple-500', requiresAdmin: true },
  ];

  const availableServices = services.filter(service => {
    if (service.requiresAdmin && user?.role !== 'ADMIN') return false;
    return true;
  });

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Access</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {availableServices.map((service) => (
          <button
            key={service.path}
            onClick={() => onNavigate?.(service.path)}
            className="flex flex-col items-center p-4 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className={`w-12 h-12 ${service.color} rounded-full flex items-center justify-center text-2xl mb-2`}>
              {service.icon}
            </div>
            <span className="text-sm font-medium text-gray-700 text-center">
              {service.name}
            </span>
            {service.nextjs && (
              <span className="text-xs text-gray-500 mt-1">Next.js</span>
            )}
            {service.react && (
              <span className="text-xs text-gray-500 mt-1">React</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
