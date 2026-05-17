import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Edit, Trash2, MapPin, Clock, User } from 'lucide-react';
import { Card, Badge, Button, Loading, Alert, Modal, Input, Select, TextArea } from '..';
import careService from '../../services/care.service';

const AppointmentCalendar = ({ elderId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAppt, setEditingAppt] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'

  useEffect(() => {
    loadAppointments();
  }, [elderId]);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const data = await careService.getAppointments(elderId);
      setAppointments(data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const deleteAppointment = async (appointmentId) => {
    if (!confirm('Are you sure you want to delete this appointment?')) return;

    try {
      await careService.deleteAppointment(appointmentId);
      await loadAppointments();
    } catch (err) {
      setError(`Failed to delete appointment: ${err.message}`);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      SCHEDULED: { variant: 'info', text: 'Scheduled' },
      COMPLETED: { variant: 'success', text: 'Completed' },
      CANCELLED: { variant: 'danger', text: 'Cancelled' },
      RESCHEDULED: { variant: 'warning', text: 'Rescheduled' },
    };
    return variants[status] || { variant: 'default', text: status };
  };

  const getTypeBadge = (type) => {
    const variants = {
      MEDICAL_CHECKUP: { variant: 'info', text: 'Medical Checkup' },
      THERAPY: { variant: 'success', text: 'Therapy' },
      DENTIST: { variant: 'default', text: 'Dentist' },
      SPECIALIST: { variant: 'warning', text: 'Specialist' },
      LAB_WORK: { variant: 'info', text: 'Lab Work' },
      FOLLOW_UP: { variant: 'default', text: 'Follow-up' },
    };
    return variants[type] || { variant: 'default', text: type };
  };

  const groupByDate = (appointments) => {
    const grouped = {};
    appointments.forEach((appt) => {
      const date = new Date(appt.startTime).toLocaleDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(appt);
    });
    return grouped;
  };

  const isUpcoming = (appointment) => {
    return new Date(appointment.startTime) > new Date();
  };

  const upcomingAppointments = appointments.filter(isUpcoming);
  const pastAppointments = appointments.filter((a) => !isUpcoming(a));

  if (loading) {
    return <Loading variant="spinner" size="lg" text="Loading appointments..." />;
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
            <h2 className="text-xl font-bold text-white mb-1">Appointment Calendar</h2>
            <p className="text-gray-400 text-sm">
              Manage medical appointments and visits
            </p>
          </div>
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => {
              setEditingAppt(null);
              setShowCreateModal(true);
            }}
          >
            Schedule Appointment
          </Button>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card padding="sm" className="bg-white/10 backdrop-blur-md border-white/20">
          <p className="text-gray-300 text-sm">Total Appointments</p>
          <p className="text-2xl font-bold text-white">{appointments.length}</p>
        </Card>
        <Card padding="sm" className="bg-blue-500/20 border-blue-500/50">
          <p className="text-blue-200 text-sm">Upcoming</p>
          <p className="text-2xl font-bold text-white">{upcomingAppointments.length}</p>
        </Card>
        <Card padding="sm" className="bg-green-500/20 border-green-500/50">
          <p className="text-green-200 text-sm">Completed</p>
          <p className="text-2xl font-bold text-white">
            {appointments.filter((a) => a.status === 'COMPLETED').length}
          </p>
        </Card>
        <Card padding="sm" className="bg-purple-500/20 border-purple-500/50">
          <p className="text-purple-200 text-sm">This Month</p>
          <p className="text-2xl font-bold text-white">
            {appointments.filter(
              (a) =>
                new Date(a.startTime).getMonth() === new Date().getMonth() &&
                new Date(a.startTime).getFullYear() === new Date().getFullYear()
            ).length}
          </p>
        </Card>
      </div>

      {/* Upcoming Appointments */}
      {upcomingAppointments.length > 0 && (
        <Card
          title="Upcoming Appointments"
          padding="normal"
          className="bg-white/10 backdrop-blur-md border-white/20"
        >
          <div className="space-y-4">
            {Object.entries(groupByDate(upcomingAppointments)).map(([date, appts]) => (
              <div key={date}>
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  {date}
                </h3>
                <div className="space-y-3">
                  {appts.map((appt) => {
                    const statusBadge = getStatusBadge(appt.status);
                    const typeBadge = getTypeBadge(appt.type);

                    return (
                      <Card
                        key={appt.id}
                        padding="normal"
                        className="bg-white/5 border-white/10"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="text-white font-semibold">{appt.title}</h4>
                              <Badge variant={typeBadge.variant}>{typeBadge.text}</Badge>
                              <Badge variant={statusBadge.variant}>{statusBadge.text}</Badge>
                            </div>

                            {appt.description && (
                              <p className="text-gray-400 text-sm mb-3">{appt.description}</p>
                            )}

                            <div className="space-y-1 text-sm">
                              <div className="flex items-center gap-2 text-gray-300">
                                <Clock className="w-4 h-4 text-gray-500" />
                                {new Date(appt.startTime).toLocaleTimeString()} -{' '}
                                {new Date(appt.endTime).toLocaleTimeString()}
                              </div>
                              {appt.location && (
                                <div className="flex items-center gap-2 text-gray-300">
                                  <MapPin className="w-4 h-4 text-gray-500" />
                                  {appt.location}
                                </div>
                              )}
                              {appt.attendees && (
                                <div className="flex items-center gap-2 text-gray-300">
                                  <User className="w-4 h-4 text-gray-500" />
                                  {Array.isArray(appt.attendees)
                                    ? appt.attendees.join(', ')
                                    : 'No attendees'}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={Edit}
                              onClick={() => {
                                setEditingAppt(appt);
                                setShowCreateModal(true);
                              }}
                              className="bg-white/5 text-white hover:bg-white/10"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={Trash2}
                              onClick={() => deleteAppointment(appt.id)}
                              className="bg-red-500/20 text-red-300 hover:bg-red-500/30"
                            />
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Past Appointments */}
      {pastAppointments.length > 0 && (
        <Card
          title="Past Appointments"
          padding="normal"
          className="bg-white/10 backdrop-blur-md border-white/20"
        >
          <div className="space-y-3">
            {pastAppointments.slice(0, 5).map((appt) => {
              const statusBadge = getStatusBadge(appt.status);
              const typeBadge = getTypeBadge(appt.type);

              return (
                <div
                  key={appt.id}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="text-white font-medium">{appt.title}</h4>
                      <Badge variant={typeBadge.variant}>{typeBadge.text}</Badge>
                      <Badge variant={statusBadge.variant}>{statusBadge.text}</Badge>
                    </div>
                    <p className="text-gray-400 text-sm">
                      {new Date(appt.startTime).toLocaleDateString()} at{' '}
                      {new Date(appt.startTime).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {appointments.length === 0 && (
        <Card padding="lg" className="bg-white/10 backdrop-blur-md border-white/20">
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              No Appointments Yet
            </h3>
            <p className="text-gray-400 mb-6">
              Schedule medical appointments and visits
            </p>
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => setShowCreateModal(true)}
            >
              Schedule First Appointment
            </Button>
          </div>
        </Card>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditingAppt(null);
        }}
        title={editingAppt ? 'Edit Appointment' : 'Schedule Appointment'}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Appointment Title"
            placeholder="e.g., Annual Checkup"
            defaultValue={editingAppt?.title}
          />

          <Select
            label="Appointment Type"
            options={[
              { value: '', label: 'Select type' },
              { value: 'MEDICAL_CHECKUP', label: 'Medical Checkup' },
              { value: 'THERAPY', label: 'Therapy' },
              { value: 'DENTIST', label: 'Dentist' },
              { value: 'SPECIALIST', label: 'Specialist' },
              { value: 'LAB_WORK', label: 'Lab Work' },
              { value: 'FOLLOW_UP', label: 'Follow-up' },
            ]}
            defaultValue={editingAppt?.type}
          />

          <TextArea
            label="Description"
            placeholder="Additional details about the appointment..."
            rows={3}
            defaultValue={editingAppt?.description}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date & Time"
              type="datetime-local"
              defaultValue={
                editingAppt?.startTime
                  ? new Date(editingAppt.startTime).toISOString().slice(0, 16)
                  : ''
              }
            />
            <Input
              label="End Date & Time"
              type="datetime-local"
              defaultValue={
                editingAppt?.endTime
                  ? new Date(editingAppt.endTime).toISOString().slice(0, 16)
                  : ''
              }
            />
          </div>

          <Input
            label="Location"
            placeholder="e.g., City Medical Center, Room 201"
            defaultValue={editingAppt?.location}
          />

          <Select
            label="Status"
            options={[
              { value: 'SCHEDULED', label: 'Scheduled' },
              { value: 'COMPLETED', label: 'Completed' },
              { value: 'CANCELLED', label: 'Cancelled' },
              { value: 'RESCHEDULED', label: 'Rescheduled' },
            ]}
            defaultValue={editingAppt?.status || 'SCHEDULED'}
          />

          <TextArea
            label="Notes"
            placeholder="Any additional notes..."
            rows={2}
            defaultValue={editingAppt?.notes}
          />
        </div>

        <div className="mt-6 flex gap-3 justify-end">
          <Button
            variant="ghost"
            onClick={() => {
              setShowCreateModal(false);
              setEditingAppt(null);
            }}
          >
            Cancel
          </Button>
          <Button variant="primary">
            {editingAppt ? 'Update Appointment' : 'Schedule Appointment'}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default AppointmentCalendar;
