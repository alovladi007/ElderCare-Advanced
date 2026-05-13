'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';

interface HomeData {
  id: string;
  name: string;
  address: string;
  elder: {
    user: {
      firstName: string;
      lastName: string;
    };
  };
  zones: Array<{
    id: string;
    name: string;
    isCriticalArea: boolean;
  }>;
  smartDevices: Array<{
    id: string;
    name: string;
    status: string;
    batteryLevel: number | null;
  }>;
}

interface Stats {
  totalDevices: number;
  onlineDevices: number;
  criticalAlerts: number;
  activeScenarios: number;
}

export default function SmartHomeDashboard() {
  const [homes, setHomes] = useState<HomeData[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalDevices: 0,
    onlineDevices: 0,
    criticalAlerts: 0,
    activeScenarios: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch homes from API
    // For now, using placeholder data
    setLoading(false);
  }, []);

  return (
    <DashboardLayout allowedRoles={['FAMILY', 'ADMIN', 'CLINICIAN']}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Smart Home Safety</h1>
            <p className="mt-2 text-gray-600">Monitor and manage smart home devices</p>
          </div>
          <Link
            href="/dashboard/smart-home/devices"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Manage Devices
          </Link>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Devices</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalDevices}</p>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Online</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.onlineDevices}</p>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-red-100 rounded-md p-3">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Critical Alerts</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.criticalAlerts}</p>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Scenarios</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.activeScenarios}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/dashboard/smart-home/devices"
            className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Devices & Zones</h3>
            <p className="text-gray-600 text-sm">Manage smart devices and home zones</p>
          </Link>

          <Link
            href="/dashboard/smart-home/automations"
            className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Automation Rules</h3>
            <p className="text-gray-600 text-sm">Configure automation rules and triggers</p>
          </Link>

          <Link
            href="/dashboard/smart-home/emergencies"
            className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Emergency Scenarios</h3>
            <p className="text-gray-600 text-sm">Set up emergency response protocols</p>
          </Link>
        </div>

        {/* Recent Events */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Recent Events</h2>
            <Link href="/dashboard/smart-home/events" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-gray-800">Motion detected in Bedroom</p>
                  <p className="text-xs text-gray-500">2 minutes ago</p>
                </div>
              </div>
              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">INFO</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-2 h-2 bg-yellow-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-gray-800">Low battery on Fall Detector</p>
                  <p className="text-xs text-gray-500">1 hour ago</p>
                </div>
              </div>
              <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded">WARNING</span>
            </div>

            <div className="text-center py-4 text-gray-500 text-sm">
              No recent events
            </div>
          </div>
        </div>

        {/* Device Status */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Device Status</h2>
          <div className="text-center py-8 text-gray-500">
            <p>No homes configured yet</p>
            <p className="text-sm mt-2">Contact your administrator to set up Smart Home monitoring</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
