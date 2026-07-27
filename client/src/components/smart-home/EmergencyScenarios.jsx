import React, { useState, useEffect, useCallback } from 'react';
import { Shield, Plus, Play, X, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, Badge, Button, Loading, Alert, Modal, Input, Select, TextArea } from '..';
import { smartHomeService } from '../../services';

const EmergencyScenarios = ({ homeId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scenarios, setScenarios] = useState([]);
  const [activeScenarios, setActiveScenarios] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [testingScenario, setTestingScenario] = useState(null);

  const loadScenarios = useCallback(async () => {
    try {
      setLoading(true);
      const data = await smartHomeService.getScenarios(homeId);
      setScenarios(data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load emergency scenarios');
    } finally {
      setLoading(false);
    }
  }, [homeId]);

  const loadActiveScenarios = useCallback(async () => {
    try {
      const data = await smartHomeService.getActiveScenarios(homeId);
      setActiveScenarios(data);
    } catch (err) {
      console.error('Failed to load active scenarios:', err);
    }
  }, [homeId]);

  useEffect(() => {
    loadScenarios();
    loadActiveScenarios();
  }, [loadScenarios, loadActiveScenarios]);

  const testScenario = async (scenarioId) => {
    try {
      setTestingScenario(scenarioId);
      await smartHomeService.testScenario(scenarioId);
      await loadActiveScenarios();
      setError(null);
    } catch (err) {
      setError(`Failed to test scenario: ${err.message}`);
    } finally {
      setTestingScenario(null);
    }
  };

  const cancelScenario = async (activeScenarioId) => {
    if (!window.confirm('Are you sure you want to cancel this active scenario?')) return;

    try {
      await smartHomeService.cancelScenario(activeScenarioId);
      await loadActiveScenarios();
    } catch (err) {
      setError(`Failed to cancel scenario: ${err.message}`);
    }
  };

  const getScenarioIcon = (scenarioType) => {
    const iconMap = {
      FIRE: AlertTriangle,
      FALL: AlertTriangle,
      INTRUSION: Shield,
      MEDICAL: AlertTriangle,
      GAS_LEAK: AlertTriangle,
    };
    return iconMap[scenarioType] || Shield;
  };

  const getSeverityBadge = (severity) => {
    const variants = {
      CRITICAL: { variant: 'danger', text: 'Critical' },
      WARNING: { variant: 'warning', text: 'Warning' },
      INFO: { variant: 'info', text: 'Info' },
    };
    return variants[severity] || { variant: 'default', text: 'Unknown' };
  };

  if (loading) {
    return <Loading variant="spinner" size="lg" text="Loading emergency scenarios..." />;
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert type="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Active Scenarios Alert */}
      {activeScenarios.length > 0 && (
        <Alert type="warning" title="Active Emergency Scenarios">
          <div className="space-y-3 mt-3">
            {activeScenarios.map((active) => (
              <div
                key={active.id}
                className="flex items-center justify-between bg-orange-500/10 p-3 rounded-lg"
              >
                <div>
                  <p className="font-semibold text-orange-100">{active.scenario.name}</p>
                  <p className="text-orange-200 text-sm">
                    Activated: {new Date(active.activatedAt).toLocaleString()}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={X}
                  onClick={() => cancelScenario(active.id)}
                  className="bg-red-500/20 text-red-300 hover:bg-red-500/30"
                >
                  Cancel
                </Button>
              </div>
            ))}
          </div>
        </Alert>
      )}

      {/* Header */}
      <Card padding="normal" className="bg-white/10 backdrop-blur-md border-white/20">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">Emergency Scenarios</h2>
            <p className="text-gray-400 text-sm">
              Pre-configured emergency response scenarios for rapid deployment
            </p>
          </div>
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => setShowCreateModal(true)}
          >
            Create Scenario
          </Button>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card padding="sm" className="bg-white/10 backdrop-blur-md border-white/20">
          <p className="text-gray-300 text-sm">Total Scenarios</p>
          <p className="text-2xl font-bold text-white">{scenarios.length}</p>
        </Card>
        <Card padding="sm" className="bg-orange-500/20 border-orange-500/50">
          <p className="text-orange-200 text-sm">Active Now</p>
          <p className="text-2xl font-bold text-white">{activeScenarios.length}</p>
        </Card>
        <Card padding="sm" className="bg-red-500/20 border-red-500/50">
          <p className="text-red-200 text-sm">Critical</p>
          <p className="text-2xl font-bold text-white">
            {scenarios.filter((s) => s.severity === 'CRITICAL').length}
          </p>
        </Card>
        <Card padding="sm" className="bg-green-500/20 border-green-500/50">
          <p className="text-green-200 text-sm">Ready</p>
          <p className="text-2xl font-bold text-white">
            {scenarios.filter((s) => s.isEnabled).length}
          </p>
        </Card>
      </div>

      {/* Scenarios Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {scenarios.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              No Emergency Scenarios Yet
            </h3>
            <p className="text-gray-400 mb-6">
              Create emergency response scenarios to protect your loved ones
            </p>
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => setShowCreateModal(true)}
            >
              Create First Scenario
            </Button>
          </div>
        ) : (
          scenarios.map((scenario) => {
            const Icon = getScenarioIcon(scenario.scenarioType);
            const severityBadge = getSeverityBadge(scenario.severity);
            const isActive = activeScenarios.some((a) => a.scenarioId === scenario.id);
            const isTesting = testingScenario === scenario.id;

            return (
              <Card
                key={scenario.id}
                padding="normal"
                className={`bg-white/10 backdrop-blur-md border-white/20 ${
                  isActive ? 'ring-2 ring-orange-500' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-red-500/20 rounded-lg">
                      <Icon className="w-6 h-6 text-red-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {scenario.name}
                      </h3>
                      <p className="text-gray-400 text-sm">{scenario.scenarioType}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Badge variant={severityBadge.variant}>{severityBadge.text}</Badge>
                    {scenario.isEnabled ? (
                      <Badge variant="success">Enabled</Badge>
                    ) : (
                      <Badge variant="default">Disabled</Badge>
                    )}
                    {isActive && <Badge variant="warning">Active</Badge>}
                  </div>
                </div>

                {scenario.description && (
                  <p className="text-gray-400 text-sm mb-4">{scenario.description}</p>
                )}

                {/* Scenario Steps */}
                <div className="bg-white/5 rounded-lg p-4 mb-4">
                  <p className="text-gray-300 text-sm font-medium mb-2">Response Steps:</p>
                  <div className="space-y-2">
                    {scenario.stepsJson && Array.isArray(scenario.stepsJson) ? (
                      scenario.stepsJson.slice(0, 3).map((step, index) => (
                        <div key={index} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-300">
                            {step.action || step.description || 'Action step'}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm">No steps configured</p>
                    )}
                    {scenario.stepsJson?.length > 3 && (
                      <p className="text-gray-500 text-xs">
                        +{scenario.stepsJson.length - 3} more steps...
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    icon={Play}
                    onClick={() => testScenario(scenario.id)}
                    disabled={!scenario.isEnabled || isActive || isTesting}
                    loading={isTesting}
                    className="flex-1"
                  >
                    {isTesting ? 'Testing...' : 'Test Scenario'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="bg-white/5 text-white hover:bg-white/10"
                  >
                    Edit
                  </Button>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Create Scenario Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Emergency Scenario"
        size="lg"
      >
        <div className="space-y-4">
          <Input label="Scenario Name" placeholder="e.g., Fire Emergency Response" />

          <TextArea
            label="Description"
            placeholder="Describe the emergency scenario..."
            rows={3}
          />

          <Select
            label="Scenario Type"
            options={[
              { value: '', label: 'Select type' },
              { value: 'FIRE', label: 'Fire Emergency' },
              { value: 'FALL', label: 'Fall Detection' },
              { value: 'INTRUSION', label: 'Intrusion Alert' },
              { value: 'MEDICAL', label: 'Medical Emergency' },
              { value: 'GAS_LEAK', label: 'Gas Leak' },
            ]}
          />

          <Select
            label="Severity"
            options={[
              { value: 'INFO', label: 'Info' },
              { value: 'WARNING', label: 'Warning' },
              { value: 'CRITICAL', label: 'Critical' },
            ]}
          />

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <p className="text-blue-200 text-sm">
              <strong>Note:</strong> Advanced step configuration requires JSON editing.
              Use the API or contact support for complex emergency scenarios.
            </p>
          </div>
        </div>

        <div className="mt-6 flex gap-3 justify-end">
          <Button variant="ghost" onClick={() => setShowCreateModal(false)}>
            Cancel
          </Button>
          <Button variant="primary">Create Scenario</Button>
        </div>
      </Modal>
    </div>
  );
};

export default EmergencyScenarios;
