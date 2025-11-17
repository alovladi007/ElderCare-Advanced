'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';

export default function ClinicianDashboard() {
  const { user } = useAuth();

  return (
    <DashboardLayout allowedRoles={['CLINICIAN']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome, Dr. {user?.lastName}!
          </h1>
          <p className="mt-2 text-gray-600">Clinical overview and patient management</p>
        </div>

        {/* Clinical Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white shadow rounded-lg p-4">
            <p className="text-sm text-gray-600">Total Patients</p>
            <p className="text-3xl font-bold text-gray-800">15</p>
          </div>
          <div className="bg-white shadow rounded-lg p-4">
            <p className="text-sm text-gray-600">Critical Alerts</p>
            <p className="text-3xl font-bold text-red-600">3</p>
          </div>
          <div className="bg-white shadow rounded-lg p-4">
            <p className="text-sm text-gray-600">Appointments Today</p>
            <p className="text-3xl font-bold text-blue-600">5</p>
          </div>
          <div className="bg-white shadow rounded-lg p-4">
            <p className="text-sm text-gray-600">Pending Reviews</p>
            <p className="text-3xl font-bold text-yellow-600">7</p>
          </div>
        </div>

        {/* Critical Alerts */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Critical Alerts</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-red-50 border-l-4 border-red-500">
              <div>
                <p className="font-medium text-gray-800">High Blood Pressure Alert - Margaret Johnson</p>
                <p className="text-sm text-gray-600">BP: 180/95 mmHg - Requires immediate attention</p>
                <p className="text-xs text-gray-500">5 minutes ago</p>
              </div>
              <button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
                Review
              </button>
            </div>
          </div>
        </div>

        {/* Patient List */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Patient Overview</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Visit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">Margaret Johnson</div>
                    <div className="text-sm text-gray-500">79 years old</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                      Attention Required
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    2 days ago
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900">View</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Care Plans Pending Review */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Pending Care Plan Reviews</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div>
                <p className="font-medium text-gray-800">Margaret Johnson - Updated Medication Plan</p>
                <p className="text-sm text-gray-600">Submitted by Nurse Jones</p>
              </div>
              <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Review
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
