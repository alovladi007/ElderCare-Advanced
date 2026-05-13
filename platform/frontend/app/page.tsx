'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            ElderCare Platform
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Comprehensive care management for elders and their families
          </p>
          <div className="space-y-4">
            <Link
              href="/login"
              className="block w-full py-3 px-6 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="block w-full py-3 px-6 bg-white text-blue-600 font-medium rounded-lg border-2 border-blue-600 hover:bg-blue-50 transition-colors"
            >
              Create Account
            </Link>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-300">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 text-center">
            Platform Features
          </h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center">
              <span className="mr-2">✓</span> 24/7 Care Task Management
            </li>
            <li className="flex items-center">
              <span className="mr-2">✓</span> Medication Tracking
            </li>
            <li className="flex items-center">
              <span className="mr-2">✓</span> Real-time Health Monitoring
            </li>
            <li className="flex items-center">
              <span className="mr-2">✓</span> Memory Care Support
            </li>
            <li className="flex items-center">
              <span className="mr-2">✓</span> Nutrition Planning
            </li>
            <li className="flex items-center">
              <span className="mr-2">✓</span> Multi-role Access (Family, Caregivers, Clinicians)
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
