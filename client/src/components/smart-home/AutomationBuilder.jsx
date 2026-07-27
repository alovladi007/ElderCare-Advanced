import React, { useState, useEffect } from 'react';
import { Zap, Plus, Edit, Trash, Play, Pause } from 'lucide-react';
import { Card, Badge, Button, Loading, Alert, Modal, Input, Select, TextArea } from '..';
import { smartHomeService } from '../../services';

const AutomationBuilder = ({ homeId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rules, setRules] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);

  useEffect(() => {
    loadRules();
  }, [homeId]);

  const loadRules = async () => {
    try {
      setLoading(true);
      const data = await smartHomeService.getRules(homeId);
      setRules(data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load automation rules');
    } finally {
      setLoading(false);
    }
  };

  const toggleRule = async (ruleId, currentState) => {
    try {
      await smartHomeService.updateRule(ruleId, { isEnabled: !currentState });
      await loadRules();
    } catch (err) {
      setError(`Failed to toggle rule: ${err.message}`);
    }
  };

  const deleteRule = async (ruleId) => {
    if (!window.confirm('Are you sure you want to delete this automation rule?')) return;

    try {
      await smartHomeService.deleteRule(ruleId);
      await loadRules();
    } catch (err) {
      setError(`Failed to delete rule: ${err.message}`);
    }
  };

  if (loading) {
    return <Loading variant="spinner" size="lg" text="Loading automation rules..." />;
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert type="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Header with Add Button */}
      <Card padding="normal" className="bg-white/10 backdrop-blur-md border-white/20">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">Automation Rules</h2>
            <p className="text-gray-400 text-sm">
              Create intelligent automation rules to control your smart home
            </p>
          </div>
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => {
              setEditingRule(null);
              setShowCreateModal(true);
            }}
          >
            Create Rule
          </Button>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card padding="sm" className="bg-white/10 backdrop-blur-md border-white/20">
          <p className="text-gray-300 text-sm">Total Rules</p>
          <p className="text-2xl font-bold text-white">{rules.length}</p>
        </Card>
        <Card padding="sm" className="bg-green-500/20 border-green-500/50">
          <p className="text-green-200 text-sm">Active</p>
          <p className="text-2xl font-bold text-white">
            {rules.filter((r) => r.isEnabled).length}
          </p>
        </Card>
        <Card padding="sm" className="bg-gray-500/20 border-gray-500/50">
          <p className="text-gray-200 text-sm">Inactive</p>
          <p className="text-2xl font-bold text-white">
            {rules.filter((r) => !r.isEnabled).length}
          </p>
        </Card>
        <Card padding="sm" className="bg-purple-500/20 border-purple-500/50">
          <p className="text-purple-200 text-sm">This Week</p>
          <p className="text-2xl font-bold text-white">
            {rules.filter(
              (r) =>
                new Date(r.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            ).length}
          </p>
        </Card>
      </div>

      {/* Rules List */}
      {rules.length === 0 ? (
        <Card padding="lg" className="bg-white/10 backdrop-blur-md border-white/20">
          <div className="text-center py-12">
            <Zap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              No Automation Rules Yet
            </h3>
            <p className="text-gray-400 mb-6">
              Create your first automation rule to make your smart home intelligent
            </p>
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => setShowCreateModal(true)}
            >
              Create Your First Rule
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {rules.map((rule) => (
            <Card
              key={rule.id}
              padding="normal"
              className="bg-white/10 backdrop-blur-md border-white/20"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-white">{rule.name}</h3>
                    <Badge variant={rule.isEnabled ? 'success' : 'default'}>
                      {rule.isEnabled ? 'Active' : 'Inactive'}
                    </Badge>
                    {rule.severity && (
                      <Badge
                        variant={
                          rule.severity === 'CRITICAL'
                            ? 'danger'
                            : rule.severity === 'WARNING'
                            ? 'warning'
                            : 'info'
                        }
                      >
                        {rule.severity}
                      </Badge>
                    )}
                  </div>
                  {rule.description && (
                    <p className="text-gray-400 text-sm mb-3">{rule.description}</p>
                  )}
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Trigger: </span>
                      <span className="text-white">{rule.triggerType}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Created: </span>
                      <span className="text-white">
                        {new Date(rule.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {rule.lastTriggered && (
                      <div>
                        <span className="text-gray-500">Last triggered: </span>
                        <span className="text-white">
                          {new Date(rule.lastTriggered).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={rule.isEnabled ? Pause : Play}
                    onClick={() => toggleRule(rule.id, rule.isEnabled)}
                    className="bg-white/5 text-white hover:bg-white/10"
                    title={rule.isEnabled ? 'Disable' : 'Enable'}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Edit}
                    onClick={() => {
                      setEditingRule(rule);
                      setShowCreateModal(true);
                    }}
                    className="bg-white/5 text-white hover:bg-white/10"
                    title="Edit"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Trash}
                    onClick={() => deleteRule(rule.id)}
                    className="bg-red-500/20 text-red-300 hover:bg-red-500/30"
                    title="Delete"
                  />
                </div>
              </div>

              {/* Rule Details */}
              <div className="bg-white/5 rounded-lg p-4 space-y-2">
                <div className="text-sm">
                  <span className="text-gray-400">When: </span>
                  <span className="text-white">
                    {JSON.stringify(rule.triggerConfigJson).substring(0, 100)}...
                  </span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-400">Then: </span>
                  <span className="text-white">
                    {Array.isArray(rule.actionsConfigJson)
                      ? `${rule.actionsConfigJson.length} action(s)`
                      : 'No actions defined'}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditingRule(null);
        }}
        title={editingRule ? 'Edit Automation Rule' : 'Create Automation Rule'}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Rule Name"
            placeholder="e.g., Turn on lights when motion detected"
            defaultValue={editingRule?.name}
          />

          <TextArea
            label="Description"
            placeholder="Describe what this rule does..."
            rows={3}
            defaultValue={editingRule?.description}
          />

          <Select
            label="Trigger Type"
            options={[
              { value: '', label: 'Select trigger' },
              { value: 'SENSOR_EVENT', label: 'Sensor Event' },
              { value: 'TIME_BASED', label: 'Time Based' },
              { value: 'COMPOSITE', label: 'Composite (Multiple Conditions)' },
            ]}
            defaultValue={editingRule?.triggerType}
          />

          <Select
            label="Severity"
            options={[
              { value: 'INFO', label: 'Info' },
              { value: 'WARNING', label: 'Warning' },
              { value: 'CRITICAL', label: 'Critical' },
            ]}
            defaultValue={editingRule?.severity}
          />

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <p className="text-blue-200 text-sm">
              <strong>Note:</strong> Advanced configuration requires JSON editing. Use
              the API or contact support for complex automation rules.
            </p>
          </div>
        </div>

        <div className="mt-6 flex gap-3 justify-end">
          <Button
            variant="ghost"
            onClick={() => {
              setShowCreateModal(false);
              setEditingRule(null);
            }}
          >
            Cancel
          </Button>
          <Button variant="primary">
            {editingRule ? 'Update Rule' : 'Create Rule'}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default AutomationBuilder;
