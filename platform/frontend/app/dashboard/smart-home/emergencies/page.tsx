'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';

interface EmergencyScenario {
  id: string;
  name: string;
  description: string | null;
  isEnabled: boolean;
  lastTriggeredAt: string | null;
  stepwiseActionsJson: Array<{
    type: string;
    delaySec: number;
    message?: string;
  }>;
}

interface ActiveScenarioInstance {
  id: string;
  currentStepIndex: number;
  status: string;
  startedAt: string;
  scenario: {
    name: string;
  };
}

export default function EmergenciesPage() {
  const [scenarios, setScenarios] = useState<EmergencyScenario[]>([]);
  const [activeInstances, setActiveInstances] = useState<ActiveScenarioInstance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch emergency scenarios from API
    setLoading(false);
  }, []);

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'ANNOUNCE':
        return '📢';
      case 'ALERT_FAMILY':
        return '👨‍👩‍👧';
      case 'ALERT_EMERGENCY':
        return '🚨';
      case 'TURN_ON_LIGHTS':
        return '💡';
      case 'UNLOCK_DOORS':
        return '🔓';
      case 'SOUND_SIREN':
        return '🔔';
      default:
        return '⚡';
    }
  };

  const handleToggleScenario = (id: string, currentState: boolean) => {
    // TODO: API call to toggle scenario
    console.log(`Toggle scenario ${id} to ${!currentState}`);
  };

  const handleCancelScenario = (instanceId: string) => {
    // TODO: API call to cancel scenario instance
    console.log(`Cancel scenario instance ${instanceId}`);
  };

  return (
    <DashboardLayout allowedRoles={['FAMILY', 'ADMIN']}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <nav className="text-sm text-gray-500 mb-2">
              <Link href="/dashboard/smart-home" className="hover:text-gray-700">Smart Home</Link>
              <span className="mx-2">/</span>
              <span className="text-gray-900">Emergency Scenarios</span>
            </nav>
            <h1 className="text-3xl font-bold text-gray-900">Emergency Scenarios</h1>
            <p className="mt-2 text-gray-600">Configure automatic emergency response protocols</p>
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Create Scenario
          </button>
        </div>

        {/* Active Scenarios */}
        {activeInstances.length > 0 && (
          <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-lg font-semibold text-red-900">Active Emergency Scenarios</h3>
                <div className="mt-4 space-y-3">
                  {activeInstances.map((instance) => (
                    <div key={instance.id} className="bg-white rounded-lg p-4 shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{instance.scenario.name}</p>
                          <p className="text-sm text-gray-600 mt-1">
                            Step {instance.currentStepIndex + 1} • Status: {instance.status}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Started: {new Date(instance.startedAt).toLocaleString()}
                          </p>
                        </div>
                        <button
                          onClick={() => handleCancelScenario(instance.id)}
                          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Scenarios List */}
        <div className="space-y-4">
          {scenarios.length === 0 ? (
            <div className="bg-white shadow rounded-lg p-12 text-center">
              <svg
                className="mx-auto h-16 w-16 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              <p className="mt-4 text-gray-500 text-lg">No emergency scenarios configured</p>
              <p className="mt-2 text-sm text-gray-400">
                Create scenarios to automatically respond to critical events
              </p>
              <button className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Create Your First Scenario
              </button>
            </div>
          ) : (
            scenarios.map((scenario) => (
              <div key={scenario.id} className="bg-white shadow rounded-lg p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-xl font-semibold text-gray-900">{scenario.name}</h3>
                      <span className={`px-2 py-1 text-xs rounded ${
                        scenario.isEnabled
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {scenario.isEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    {scenario.description && (
                      <p className="mt-2 text-gray-600">{scenario.description}</p>
                    )}
                    {scenario.lastTriggeredAt && (
                      <p className="mt-1 text-sm text-gray-500">
                        Last triggered: {new Date(scenario.lastTriggeredAt).toLocaleString()}
                      </p>
                    )}

                    {/* Action Steps */}
                    <div className="mt-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Action Steps:</h4>
                      <div className="space-y-2">
                        {scenario.stepwiseActionsJson.map((step, index) => (
                          <div key={index} className="flex items-start space-x-3 text-sm">
                            <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-semibold">
                              {index + 1}
                            </span>
                            <div className="flex-1">
                              <span className="font-medium">{getActionIcon(step.type)} {step.type.replace(/_/g, ' ')}</span>
                              {step.delaySec > 0 && (
                                <span className="ml-2 text-gray-500">({step.delaySec}s delay)</span>
                              )}
                              {step.message && (
                                <p className="text-gray-600 mt-1 italic">"{step.message}"</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="ml-4 flex flex-col space-y-2">
                    <button
                      onClick={() => handleToggleScenario(scenario.id, scenario.isEnabled)}
                      className={`px-4 py-2 rounded ${
                        scenario.isEnabled
                          ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {scenario.isEnabled ? 'Disable' : 'Enable'}
                    </button>
                    <button className="px-4 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100">
                      Edit
                    </button>
                    <button className="px-4 py-2 bg-red-50 text-red-600 rounded hover:bg-red-100">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                Emergency scenarios trigger automatically based on sensor events and execute a series of timed actions to ensure safety.
                Each scenario can alert family members, turn on lights, unlock doors, and escalate to emergency services if needed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
