'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';

export default function ElderDashboard() {
  const { user } = useAuth();

  return (
    <DashboardLayout allowedRoles={['ELDER']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="mt-2 text-gray-600">Here's your daily overview</p>
        </div>

        {/* Today's Tasks */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Today's Tasks</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded">
              <div>
                <p className="font-medium text-gray-800">Morning Medication</p>
                <p className="text-sm text-gray-600">8:00 AM - Due soon</p>
              </div>
              <span className="px-3 py-1 bg-yellow-200 text-yellow-800 text-sm rounded">
                Pending
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div>
                <p className="font-medium text-gray-800">Breakfast</p>
                <p className="text-sm text-gray-600">8:30 AM</p>
              </div>
              <span className="px-3 py-1 bg-green-200 text-green-800 text-sm rounded">
                Scheduled
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div>
                <p className="font-medium text-gray-800">Physical Therapy</p>
                <p className="text-sm text-gray-600">10:00 AM</p>
              </div>
              <span className="px-3 py-1 bg-green-200 text-green-800 text-sm rounded">
                Scheduled
              </span>
            </div>
          </div>
        </div>

        {/* Health Status */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Health Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 rounded">
              <p className="text-sm text-gray-600">Blood Pressure</p>
              <p className="text-2xl font-bold text-gray-800">120/80</p>
              <p className="text-xs text-green-600">Normal</p>
            </div>
            <div className="p-4 bg-blue-50 rounded">
              <p className="text-sm text-gray-600">Heart Rate</p>
              <p className="text-2xl font-bold text-gray-800">72 bpm</p>
              <p className="text-xs text-blue-600">Normal</p>
            </div>
            <div className="p-4 bg-purple-50 rounded">
              <p className="text-sm text-gray-600">Blood Glucose</p>
              <p className="text-2xl font-bold text-gray-800">110 mg/dL</p>
              <p className="text-xs text-purple-600">Normal</p>
            </div>
          </div>
        </div>

        {/* Upcoming Appointments */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Upcoming Appointments
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border-l-4 border-blue-500 bg-gray-50">
              <div>
                <p className="font-medium text-gray-800">Dr. Smith - Checkup</p>
                <p className="text-sm text-gray-600">Tomorrow at 2:00 PM</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 border-l-4 border-purple-500 bg-gray-50">
              <div>
                <p className="font-medium text-gray-800">Dental Cleaning</p>
                <p className="text-sm text-gray-600">Next Week - Monday 10:00 AM</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
