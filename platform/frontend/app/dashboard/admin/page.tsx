'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminDashboard() {
  const { user } = useAuth();

  return (
    <DashboardLayout allowedRoles={['ADMIN']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Admin Dashboard
          </h1>
          <p className="mt-2 text-gray-600">System overview and management</p>
        </div>

        {/* System Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white shadow rounded-lg p-4">
            <p className="text-sm text-gray-600">Total Users</p>
            <p className="text-3xl font-bold text-gray-800">234</p>
            <p className="text-xs text-green-600 mt-1">+12 this month</p>
          </div>
          <div className="bg-white shadow rounded-lg p-4">
            <p className="text-sm text-gray-600">Active Elders</p>
            <p className="text-3xl font-bold text-blue-600">87</p>
          </div>
          <div className="bg-white shadow rounded-lg p-4">
            <p className="text-sm text-gray-600">Care Staff</p>
            <p className="text-3xl font-bold text-purple-600">42</p>
          </div>
          <div className="bg-white shadow rounded-lg p-4">
            <p className="text-sm text-gray-600">System Health</p>
            <p className="text-3xl font-bold text-green-600">98%</p>
          </div>
        </div>

        {/* User Management */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Recent Users</h2>
            <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Add User
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Dr. Sarah Smith
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    dr.smith@eldercare.com
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                      CLINICIAN
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Active
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
                    <button className="text-red-600 hover:text-red-900">Deactivate</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* System Activity */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">System Activity</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div>
                <p className="text-sm text-gray-600">API Requests (24h)</p>
                <p className="text-2xl font-bold text-gray-800">45,234</p>
              </div>
              <span className="text-green-600 text-sm">+5.2%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div>
                <p className="text-sm text-gray-600">Active Sessions</p>
                <p className="text-2xl font-bold text-gray-800">123</p>
              </div>
              <span className="text-blue-600 text-sm">Normal</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div>
                <p className="text-sm text-gray-600">Database Size</p>
                <p className="text-2xl font-bold text-gray-800">2.4 GB</p>
              </div>
              <span className="text-gray-600 text-sm">Healthy</span>
            </div>
          </div>
        </div>

        {/* Notifications Service Status */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Service Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-gray-800">Email Service</p>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                  Online
                </span>
              </div>
              <p className="text-sm text-gray-600">Last email sent: 2 minutes ago</p>
            </div>
            <div className="p-4 border rounded">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-gray-800">SMS Service</p>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                  Online
                </span>
              </div>
              <p className="text-sm text-gray-600">Last SMS sent: 5 minutes ago</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
