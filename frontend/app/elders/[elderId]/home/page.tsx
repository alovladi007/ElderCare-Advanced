'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { smartHomeApi } from '@/lib/api';
import Link from 'next/link';

export default function SmartHomeDashboard() {
  const params = useParams();
  const elderId = params.elderId as string;

  const [home, setHome] = useState<any>(null);
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHomeData();
    // Refresh every 30 seconds
    const interval = setInterval(loadHomeData, 30000);
    return () => clearInterval(interval);
  }, [elderId]);

  const loadHomeData = async () => {
    try {
      setError(null);
      const [homeRes, statusRes] = await Promise.all([
        smartHomeApi.getHomeByElderId(elderId),
        smartHomeApi.getHomeByElderId(elderId).then(res =>
          smartHomeApi.getHomeStatus(res.data.id)
        ),
      ]);

      setHome(homeRes.data);
      setStatus(statusRes.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load home data');
      console.error('Error loading home data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadHomeData}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!home) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">No home found for this elder</div>
      </div>
    );
  }

  const { deviceSummary, recentAlerts, recentCriticalEvents } = status || {};

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{home.name}</h1>
              <p className="text-gray-600">{home.address}</p>
            </div>
            <div className="flex gap-4">
              <Link
                href={`/homes/${home.id}/automations`}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Automation Rules
              </Link>
              <Link
                href={`/homes/${home.id}/emergencies`}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Emergency Scenarios
              </Link>
              <Link
                href={`/admin/simulator?homeId=${home.id}`}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Simulator
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Device Status Summary */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Devices</p>
                <p className="text-3xl font-bold text-gray-900">{deviceSummary?.total || 0}</p>
              </div>
              <div className="text-4xl">📱</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Online</p>
                <p className="text-3xl font-bold text-green-600">{deviceSummary?.online || 0}</p>
              </div>
              <div className="text-4xl">✅</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Offline</p>
                <p className="text-3xl font-bold text-red-600">{deviceSummary?.offline || 0}</p>
              </div>
              <div className="text-4xl">❌</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Low Battery</p>
                <p className="text-3xl font-bold text-orange-600">{deviceSummary?.lowBattery || 0}</p>
              </div>
              <div className="text-4xl">🔋</div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Zones Overview */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Rooms & Zones</h2>
            </div>
            <div className="p-6">
              {home.zones && home.zones.length > 0 ? (
                <div className="space-y-4">
                  {home.zones.map((zone: any) => (
                    <div key={zone.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900">{zone.name}</h3>
                          {zone.description && (
                            <p className="text-sm text-gray-600">{zone.description}</p>
                          )}
                        </div>
                        {zone.isCriticalArea && (
                          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">
                            Critical
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        {zone.devices?.length || 0} device(s)
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No zones configured</p>
              )}
            </div>
          </div>

          {/* Recent Alerts */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Recent Alerts (24h)</h2>
            </div>
            <div className="p-6">
              {recentAlerts && recentAlerts.length > 0 ? (
                <div className="space-y-3">
                  {recentAlerts.map((alert: any) => (
                    <div
                      key={alert.id}
                      className={`border-l-4 p-3 rounded ${
                        alert.severity === 'CRITICAL'
                          ? 'border-red-500 bg-red-50'
                          : alert.severity === 'WARNING'
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-blue-500 bg-blue-50'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-gray-900">{alert.title}</h4>
                          <p className="text-sm text-gray-600">{alert.message}</p>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs rounded ${
                            alert.severity === 'CRITICAL'
                              ? 'bg-red-200 text-red-800'
                              : alert.severity === 'WARNING'
                              ? 'bg-orange-200 text-orange-800'
                              : 'bg-blue-200 text-blue-800'
                          }`}
                        >
                          {alert.severity}
                        </span>
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        {new Date(alert.triggeredAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No recent alerts</p>
              )}
            </div>
          </div>

          {/* Recent Critical Events */}
          <div className="bg-white rounded-lg shadow md:col-span-2">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Recent Critical Events</h2>
            </div>
            <div className="p-6">
              {recentCriticalEvents && recentCriticalEvents.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-4">Time</th>
                        <th className="text-left py-2 px-4">Device</th>
                        <th className="text-left py-2 px-4">Zone</th>
                        <th className="text-left py-2 px-4">Sensor</th>
                        <th className="text-left py-2 px-4">Event</th>
                        <th className="text-left py-2 px-4">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentCriticalEvents.map((event: any) => (
                        <tr key={event.id} className="border-b hover:bg-gray-50">
                          <td className="py-2 px-4 text-sm">
                            {new Date(event.occurredAt).toLocaleString()}
                          </td>
                          <td className="py-2 px-4 text-sm">{event.device.name}</td>
                          <td className="py-2 px-4 text-sm">{event.device.zone?.name || '-'}</td>
                          <td className="py-2 px-4 text-sm">{event.sensor.sensorType}</td>
                          <td className="py-2 px-4 text-sm">{event.eventType}</td>
                          <td className="py-2 px-4 text-sm">
                            {event.valueText || event.valueNumeric || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-600">No critical events in the last 24 hours</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
