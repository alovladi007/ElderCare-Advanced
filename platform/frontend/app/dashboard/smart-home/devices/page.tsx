'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';

interface Device {
  id: string;
  name: string;
  status: 'ONLINE' | 'OFFLINE' | 'UNKNOWN';
  batteryLevel: number | null;
  zone?: {
    name: string;
  };
  deviceType: {
    name: string;
    category: string;
  };
  lastSeenAt: string | null;
}

interface Zone {
  id: string;
  name: string;
  isCriticalArea: boolean;
  _count: {
    smartDevices: number;
  };
}

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch devices and zones from API
    setLoading(false);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ONLINE':
        return 'bg-green-100 text-green-800';
      case 'OFFLINE':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getBatteryColor = (level: number | null) => {
    if (!level) return 'text-gray-400';
    if (level > 50) return 'text-green-600';
    if (level > 20) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <DashboardLayout allowedRoles={['FAMILY', 'ADMIN']}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <nav className="text-sm text-gray-500 mb-2">
              <Link href="/dashboard/smart-home" className="hover:text-gray-700">Smart Home</Link>
              <span className="mx-2">/</span>
              <span className="text-gray-900">Devices</span>
            </nav>
            <h1 className="text-3xl font-bold text-gray-900">Devices & Zones</h1>
            <p className="mt-2 text-gray-600">Manage smart devices and home zones</p>
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Add Device
          </button>
        </div>

        {/* Zone Filters */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Filter by Zone</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedZone('all')}
              className={`px-4 py-2 rounded-lg ${
                selectedZone === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Zones ({devices.length})
            </button>
            {zones.map((zone) => (
              <button
                key={zone.id}
                onClick={() => setSelectedZone(zone.id)}
                className={`px-4 py-2 rounded-lg ${
                  selectedZone === zone.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {zone.name}
                {zone.isCriticalArea && ' ⚠️'}
                ({zone._count.smartDevices})
              </button>
            ))}
          </div>
        </div>

        {/* Home Zones Grid */}
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Home Zones</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {zones.length === 0 ? (
              <div className="col-span-full bg-white shadow rounded-lg p-8 text-center">
                <p className="text-gray-500">No zones configured yet</p>
                <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Create Zone
                </button>
              </div>
            ) : (
              zones.map((zone) => (
                <div key={zone.id} className="bg-white shadow rounded-lg p-6">
                  <div className="flex items-start justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">{zone.name}</h3>
                    {zone.isCriticalArea && (
                      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">Critical</span>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-gray-600">{zone._count.smartDevices} devices</p>
                  <div className="mt-4 flex space-x-2">
                    <button className="text-sm text-blue-600 hover:text-blue-700">View</button>
                    <button className="text-sm text-gray-600 hover:text-gray-700">Edit</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Devices List */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Smart Devices</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {devices.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                  />
                </svg>
                <p className="mt-4 text-gray-500">No devices found</p>
                <p className="mt-1 text-sm text-gray-400">Add your first smart device to get started</p>
              </div>
            ) : (
              devices.map((device) => (
                <div key={device.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-medium text-gray-900">{device.name}</h3>
                        <span className={`px-2 py-1 text-xs rounded ${getStatusColor(device.status)}`}>
                          {device.status}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                        <span>{device.deviceType.name}</span>
                        {device.zone && <span>• {device.zone.name}</span>}
                        {device.batteryLevel !== null && (
                          <span className="flex items-center space-x-1">
                            <svg
                              className={`h-4 w-4 ${getBatteryColor(device.batteryLevel)}`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M3 6a1 1 0 011-1h10a1 1 0 011 1v8a1 1 0 01-1 1H4a1 1 0 01-1-1V6zm2 2v4h8V8H5zm10-1h1a1 1 0 011 1v2a1 1 0 01-1 1h-1V7z" />
                            </svg>
                            <span className={getBatteryColor(device.batteryLevel)}>{device.batteryLevel}%</span>
                          </span>
                        )}
                        {device.lastSeenAt && <span>• Last seen: {new Date(device.lastSeenAt).toLocaleString()}</span>}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded">
                        Details
                      </button>
                      <button className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-50 rounded">
                        Settings
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
