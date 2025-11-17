'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';

export default function CaregiverDashboard() {
  const { user } = useAuth();

  return (
    <DashboardLayout allowedRoles={['CAREGIVER']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome, {user?.firstName}!
          </h1>
          <p className="mt-2 text-gray-600">Your daily care tasks and assignments</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white shadow rounded-lg p-4">
            <p className="text-sm text-gray-600">Assigned Elders</p>
            <p className="text-3xl font-bold text-gray-800">3</p>
          </div>
          <div className="bg-white shadow rounded-lg p-4">
            <p className="text-sm text-gray-600">Pending Tasks</p>
            <p className="text-3xl font-bold text-yellow-600">12</p>
          </div>
          <div className="bg-white shadow rounded-lg p-4">
            <p className="text-sm text-gray-600">Completed Today</p>
            <p className="text-3xl font-bold text-green-600">8</p>
          </div>
          <div className="bg-white shadow rounded-lg p-4">
            <p className="text-sm text-gray-600">Active Alerts</p>
            <p className="text-3xl font-bold text-red-600">2</p>
          </div>
        </div>

        {/* Priority Tasks */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Priority Tasks</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-red-50 border-l-4 border-red-500">
              <div>
                <p className="font-medium text-gray-800">Margaret Johnson - Medication</p>
                <p className="text-sm text-gray-600">Overdue by 15 minutes</p>
              </div>
              <button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
                Complete
              </button>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 border-l-4 border-yellow-500">
              <div>
                <p className="font-medium text-gray-800">John Doe - Vitals Check</p>
                <p className="text-sm text-gray-600">Due in 30 minutes</p>
              </div>
              <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Start
              </button>
            </div>
          </div>
        </div>

        {/* Assigned Elders */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Assigned Elders</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg hover:shadow-md cursor-pointer">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                  MJ
                </div>
                <div>
                  <p className="font-medium text-gray-800">Margaret Johnson</p>
                  <p className="text-sm text-gray-600">79 years old</p>
                </div>
              </div>
              <div className="mt-3 space-y-1 text-sm">
                <p><span className="text-gray-600">Tasks:</span> 4 pending</p>
                <p><span className="text-gray-600">Status:</span> <span className="text-green-600">Stable</span></p>
              </div>
            </div>
            <div className="p-4 border rounded-lg hover:shadow-md cursor-pointer">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                  JD
                </div>
                <div>
                  <p className="font-medium text-gray-800">John Doe</p>
                  <p className="text-sm text-gray-600">82 years old</p>
                </div>
              </div>
              <div className="mt-3 space-y-1 text-sm">
                <p><span className="text-gray-600">Tasks:</span> 3 pending</p>
                <p><span className="text-gray-600">Status:</span> <span className="text-yellow-600">Attention needed</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
