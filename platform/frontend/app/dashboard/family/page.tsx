'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';

export default function FamilyDashboard() {
  const { user } = useAuth();

  return (
    <DashboardLayout allowedRoles={['FAMILY']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome, {user?.firstName}!
          </h1>
          <p className="mt-2 text-gray-600">Monitor your loved one's care</p>
        </div>

        {/* Alerts & Notifications */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Alerts</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-yellow-50 border-l-4 border-yellow-500">
              <div>
                <p className="font-medium text-gray-800">Medication Reminder</p>
                <p className="text-sm text-gray-600">Margaret missed morning medication</p>
                <p className="text-xs text-gray-500">30 minutes ago</p>
              </div>
              <span className="px-3 py-1 bg-yellow-200 text-yellow-800 text-sm rounded">
                Warning
              </span>
            </div>
          </div>
        </div>

        {/* Elder Status */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Margaret's Status</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Overall Health</span>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded">Good</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Tasks Completed Today</span>
              <span className="font-semibold text-gray-800">5 / 8</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Medication Adherence</span>
              <span className="font-semibold text-gray-800">95%</span>
            </div>
          </div>
        </div>

        {/* Care Team */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Care Team</h2>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                DS
              </div>
              <div>
                <p className="font-medium text-gray-800">Dr. Smith</p>
                <p className="text-sm text-gray-600">Primary Clinician</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold">
                NJ
              </div>
              <div>
                <p className="font-medium text-gray-800">Nurse Jones</p>
                <p className="text-sm text-gray-600">Primary Caregiver</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
