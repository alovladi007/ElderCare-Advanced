'use client';

import { useState } from 'react';
import { smartHomeApi } from '@/lib/api';
import { useSearchParams } from 'next/navigation';

export default function SimulatorPage() {
  const searchParams = useSearchParams();
  const [homeId, setHomeId] = useState(searchParams.get('homeId') || '');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const runSimulation = async (type: string, params?: any) => {
    if (!homeId) {
      setError('Please enter a Home ID');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      let response;
      switch (type) {
        case 'fall':
          response = await smartHomeApi.simulateFall(homeId);
          break;
        case 'smoke':
          response = await smartHomeApi.simulateSmoke(homeId);
          break;
        case 'gasLeak':
          response = await smartHomeApi.simulateGasLeak(homeId);
          break;
        case 'waterLeak':
          response = await smartHomeApi.simulateWaterLeak(homeId);
          break;
        case 'motionPattern':
          response = await smartHomeApi.simulateMotionPattern(homeId, params?.duration || 60);
          break;
        default:
          throw new Error('Unknown simulation type');
      }
      setResult(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Simulation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Smart Home Simulator
          </h1>
          <p className="text-gray-600 mb-8">
            Test emergency scenarios and automation rules
          </p>

          {/* Home ID Input */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Home ID (required)
            </label>
            <input
              type="text"
              value={homeId}
              onChange={(e) => setHomeId(e.target.value)}
              placeholder="Enter home ID from seed data"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="mt-2 text-sm text-gray-500">
              Tip: Run the seed script and copy the Home ID from the output
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Result Display */}
          {result && (
            <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded">
              <p className="text-green-700 font-semibold mb-2">✅ Simulation Successful!</p>
              <pre className="text-sm text-gray-700 overflow-x-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}

          {/* Simulation Buttons */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Fall Detection */}
            <button
              onClick={() => runSimulation('fall')}
              disabled={loading}
              className="p-6 bg-red-50 border-2 border-red-200 rounded-lg hover:border-red-400 hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              <div className="text-4xl mb-2">🤕</div>
              <h3 className="font-bold text-gray-900 mb-1">Fall Detection</h3>
              <p className="text-sm text-gray-600">
                Triggers fall + no response emergency scenario
              </p>
            </button>

            {/* Smoke Detection */}
            <button
              onClick={() => runSimulation('smoke')}
              disabled={loading}
              className="p-6 bg-orange-50 border-2 border-orange-200 rounded-lg hover:border-orange-400 hover:bg-orange-100 transition-colors disabled:opacity-50"
            >
              <div className="text-4xl mb-2">🔥</div>
              <h3 className="font-bold text-gray-900 mb-1">Smoke Detection</h3>
              <p className="text-sm text-gray-600">
                Triggers fire emergency protocol
              </p>
            </button>

            {/* Gas Leak */}
            <button
              onClick={() => runSimulation('gasLeak')}
              disabled={loading}
              className="p-6 bg-yellow-50 border-2 border-yellow-200 rounded-lg hover:border-yellow-400 hover:bg-yellow-100 transition-colors disabled:opacity-50"
            >
              <div className="text-4xl mb-2">⚠️</div>
              <h3 className="font-bold text-gray-900 mb-1">Gas Leak</h3>
              <p className="text-sm text-gray-600">
                Triggers gas leak emergency protocol
              </p>
            </button>

            {/* Water Leak */}
            <button
              onClick={() => runSimulation('waterLeak')}
              disabled={loading}
              className="p-6 bg-blue-50 border-2 border-blue-200 rounded-lg hover:border-blue-400 hover:bg-blue-100 transition-colors disabled:opacity-50"
            >
              <div className="text-4xl mb-2">💧</div>
              <h3 className="font-bold text-gray-900 mb-1">Water Leak</h3>
              <p className="text-sm text-gray-600">
                Creates water leak alert
              </p>
            </button>

            {/* Motion Pattern */}
            <button
              onClick={() => runSimulation('motionPattern', { duration: 60 })}
              disabled={loading}
              className="p-6 bg-green-50 border-2 border-green-200 rounded-lg hover:border-green-400 hover:bg-green-100 transition-colors disabled:opacity-50"
            >
              <div className="text-4xl mb-2">🚶</div>
              <h3 className="font-bold text-gray-900 mb-1">Motion Pattern</h3>
              <p className="text-sm text-gray-600">
                Simulates normal activity (60 min)
              </p>
            </button>
          </div>

          {loading && (
            <div className="mt-8 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Running simulation...</p>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-12 p-6 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-bold text-gray-900 mb-4">How to Use</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>Ensure the backend is running (npm run dev in /backend)</li>
              <li>Run database migrations: <code className="bg-gray-200 px-2 py-1 rounded">npm run prisma:migrate</code></li>
              <li>Seed the database: <code className="bg-gray-200 px-2 py-1 rounded">npm run seed</code></li>
              <li>Copy the Home ID from the seed output</li>
              <li>Paste it into the Home ID field above</li>
              <li>Click any simulation button to test</li>
              <li>Check the Smart Home Dashboard to see the results</li>
            </ol>
          </div>

          {/* Expected Behavior */}
          <div className="mt-6 p-6 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Expected Behavior</h3>
            <div className="space-y-3 text-gray-700">
              <div>
                <strong>Fall Detection:</strong> Creates sensor event → Triggers emergency scenario →
                Announces via TTS → Waits 60s → Alerts family → Waits 180s → Calls emergency
              </div>
              <div>
                <strong>Smoke Detection:</strong> Creates sensor event → Triggers fire scenario →
                Activates siren → Announces evacuation → Alerts family → Calls emergency → Unlocks doors
              </div>
              <div>
                <strong>Water/Gas Leak:</strong> Creates sensor event → Creates alert →
                May trigger automation rules if configured
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
