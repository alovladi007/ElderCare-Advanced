import React, { useState, useEffect } from 'react';
import { Pill, Plus, Edit, Trash2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Card, Badge, Button, Loading, Alert, Modal, Input, Select, TextArea } from '..';
import careService from '../../services/care.service';

const MedicationSchedule = ({ elderId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [medications, setMedications] = useState([]);
  const [upcomingDoses, setUpcomingDoses] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingMed, setEditingMed] = useState(null);
  const [recordingDose, setRecordingDose] = useState(null);

  useEffect(() => {
    loadMedications();
    loadUpcomingDoses();
  }, [elderId]);

  const loadMedications = async () => {
    try {
      setLoading(true);
      const data = await careService.getMedications(elderId);
      setMedications(data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load medications');
    } finally {
      setLoading(false);
    }
  };

  const loadUpcomingDoses = async () => {
    try {
      const data = await careService.getUpcomingDoses(elderId);
      setUpcomingDoses(data);
    } catch (err) {
      console.error('Failed to load upcoming doses:', err);
    }
  };

  const handleRecordDose = async (doseId, status) => {
    try {
      setRecordingDose(doseId);
      await careService.recordDose(doseId, {
        status,
        takenAt: status === 'TAKEN' ? new Date().toISOString() : null,
      });
      await loadUpcomingDoses();
      await loadMedications();
    } catch (err) {
      setError(`Failed to record dose: ${err.message}`);
    } finally {
      setRecordingDose(null);
    }
  };

  const deleteMedication = async (medicationId) => {
    if (!confirm('Are you sure you want to delete this medication?')) return;

    try {
      await careService.deleteMedication(medicationId);
      await loadMedications();
    } catch (err) {
      setError(`Failed to delete medication: ${err.message}`);
    }
  };

  const getFrequencyBadge = (frequency) => {
    const variants = {
      ONCE_DAILY: { variant: 'info', text: 'Once Daily' },
      TWICE_DAILY: { variant: 'info', text: 'Twice Daily' },
      THREE_TIMES_DAILY: { variant: 'info', text: '3× Daily' },
      FOUR_TIMES_DAILY: { variant: 'warning', text: '4× Daily' },
      WEEKLY: { variant: 'default', text: 'Weekly' },
      AS_NEEDED: { variant: 'default', text: 'As Needed' },
    };
    return variants[frequency] || { variant: 'default', text: frequency };
  };

  if (loading) {
    return <Loading variant="spinner" size="lg" text="Loading medications..." />;
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert type="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Header */}
      <Card padding="normal" className="bg-white/10 backdrop-blur-md border-white/20">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">Medication Schedule</h2>
            <p className="text-gray-400 text-sm">
              Manage medications and track doses
            </p>
          </div>
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => {
              setEditingMed(null);
              setShowCreateModal(true);
            }}
          >
            Add Medication
          </Button>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card padding="sm" className="bg-white/10 backdrop-blur-md border-white/20">
          <p className="text-gray-300 text-sm">Total Medications</p>
          <p className="text-2xl font-bold text-white">{medications.length}</p>
        </Card>
        <Card padding="sm" className="bg-green-500/20 border-green-500/50">
          <p className="text-green-200 text-sm">Active</p>
          <p className="text-2xl font-bold text-white">
            {medications.filter((m) => m.isActive).length}
          </p>
        </Card>
        <Card padding="sm" className="bg-blue-500/20 border-blue-500/50">
          <p className="text-blue-200 text-sm">Today's Doses</p>
          <p className="text-2xl font-bold text-white">{upcomingDoses.length}</p>
        </Card>
        <Card padding="sm" className="bg-orange-500/20 border-orange-500/50">
          <p className="text-orange-200 text-sm">Pending</p>
          <p className="text-2xl font-bold text-white">
            {upcomingDoses.filter((d) => d.status === 'PENDING').length}
          </p>
        </Card>
      </div>

      {/* Upcoming Doses */}
      {upcomingDoses.length > 0 && (
        <Card
          title="Today's Schedule"
          padding="normal"
          className="bg-white/10 backdrop-blur-md border-white/20"
        >
          <div className="space-y-3">
            {upcomingDoses.map((dose) => (
              <Card
                key={dose.id}
                padding="normal"
                className="bg-white/5 border-white/10"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="p-3 bg-blue-500/20 rounded-lg">
                      <Pill className="w-6 h-6 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold">
                        {dose.medication?.name}
                      </h3>
                      <p className="text-gray-400 text-sm">
                        {dose.medication?.dosage}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-500 text-xs">
                          {new Date(dose.scheduledAt).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        dose.status === 'TAKEN'
                          ? 'success'
                          : dose.status === 'MISSED'
                          ? 'danger'
                          : 'default'
                      }
                    >
                      {dose.status}
                    </Badge>

                    {dose.status === 'PENDING' && (
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={CheckCircle}
                          onClick={() => handleRecordDose(dose.id, 'TAKEN')}
                          disabled={recordingDose === dose.id}
                          className="bg-green-500/20 text-green-300 hover:bg-green-500/30"
                          title="Mark as taken"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={XCircle}
                          onClick={() => handleRecordDose(dose.id, 'MISSED')}
                          disabled={recordingDose === dose.id}
                          className="bg-red-500/20 text-red-300 hover:bg-red-500/30"
                          title="Mark as missed"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Card>
      )}

      {/* Medications List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {medications.length === 0 ? (
          <Card padding="lg" className="bg-white/10 backdrop-blur-md border-white/20 col-span-full">
            <div className="text-center py-12">
              <Pill className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                No Medications Yet
              </h3>
              <p className="text-gray-400 mb-6">
                Add medications to track doses and schedules
              </p>
              <Button
                variant="primary"
                icon={Plus}
                onClick={() => setShowCreateModal(true)}
              >
                Add First Medication
              </Button>
            </div>
          </Card>
        ) : (
          medications.map((med) => {
            const frequencyBadge = getFrequencyBadge(med.frequency);

            return (
              <Card
                key={med.id}
                padding="normal"
                className="bg-white/10 backdrop-blur-md border-white/20"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">{med.name}</h3>
                      {med.isActive ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="default">Inactive</Badge>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm mb-3">{med.dosage}</p>
                    <Badge variant={frequencyBadge.variant} className="mb-3">
                      {frequencyBadge.text}
                    </Badge>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={Edit}
                      onClick={() => {
                        setEditingMed(med);
                        setShowCreateModal(true);
                      }}
                      className="bg-white/5 text-white hover:bg-white/10"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={Trash2}
                      onClick={() => deleteMedication(med.id)}
                      className="bg-red-500/20 text-red-300 hover:bg-red-500/30"
                    />
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  {med.instructions && (
                    <p className="text-gray-300">
                      <span className="text-gray-500">Instructions:</span> {med.instructions}
                    </p>
                  )}
                  {med.prescribedBy && (
                    <p className="text-gray-300">
                      <span className="text-gray-500">Prescribed by:</span> {med.prescribedBy}
                    </p>
                  )}
                  <p className="text-gray-500 text-xs">
                    Started: {new Date(med.startDate).toLocaleDateString()}
                    {med.endDate && ` • Ends: ${new Date(med.endDate).toLocaleDateString()}`}
                  </p>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditingMed(null);
        }}
        title={editingMed ? 'Edit Medication' : 'Add Medication'}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Medication Name"
            placeholder="e.g., Aspirin"
            defaultValue={editingMed?.name}
          />

          <Input
            label="Dosage"
            placeholder="e.g., 100mg"
            defaultValue={editingMed?.dosage}
          />

          <Select
            label="Frequency"
            options={[
              { value: '', label: 'Select frequency' },
              { value: 'ONCE_DAILY', label: 'Once Daily' },
              { value: 'TWICE_DAILY', label: 'Twice Daily' },
              { value: 'THREE_TIMES_DAILY', label: 'Three Times Daily' },
              { value: 'FOUR_TIMES_DAILY', label: 'Four Times Daily' },
              { value: 'WEEKLY', label: 'Weekly' },
              { value: 'AS_NEEDED', label: 'As Needed' },
            ]}
            defaultValue={editingMed?.frequency}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              defaultValue={editingMed?.startDate?.split('T')[0]}
            />
            <Input
              label="End Date (Optional)"
              type="date"
              defaultValue={editingMed?.endDate?.split('T')[0]}
            />
          </div>

          <Input
            label="Prescribed By"
            placeholder="e.g., Dr. Smith"
            defaultValue={editingMed?.prescribedBy}
          />

          <TextArea
            label="Instructions"
            placeholder="Special instructions for taking this medication..."
            rows={3}
            defaultValue={editingMed?.instructions}
          />

          <TextArea
            label="Side Effects"
            placeholder="Known side effects..."
            rows={2}
            defaultValue={editingMed?.sideEffects}
          />
        </div>

        <div className="mt-6 flex gap-3 justify-end">
          <Button
            variant="ghost"
            onClick={() => {
              setShowCreateModal(false);
              setEditingMed(null);
            }}
          >
            Cancel
          </Button>
          <Button variant="primary">
            {editingMed ? 'Update Medication' : 'Add Medication'}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default MedicationSchedule;
