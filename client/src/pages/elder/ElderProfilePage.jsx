import React, { useState, useEffect, useCallback } from 'react';
import { User, Heart, Phone, FileText, Users } from 'lucide-react';
import { Container, Card, Loading, Alert, Badge } from '../../components';
import ProfilePhotoUpload from '../../components/elder/ProfilePhotoUpload';
import BasicInfoForm from '../../components/elder/BasicInfoForm';
import EmergencyContactManager from '../../components/elder/EmergencyContactManager';
import MedicalHistoryForm from '../../components/elder/MedicalHistoryForm';
import FamilyMemberManager from '../../components/elder/FamilyMemberManager';
import elderService from '../../services/elder.service';

const ElderProfilePage = ({ elderId }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('basic');

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: User },
    { id: 'emergency', label: 'Emergency Contacts', icon: Phone },
    { id: 'medical', label: 'Medical History', icon: Heart },
    { id: 'family', label: 'Family Members', icon: Users },
  ];

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const data = await elderService.getById(elderId);
      setProfile(data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load elder profile');
    } finally {
      setLoading(false);
    }
  }, [elderId]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleSave = async (updatedData) => {
    try {
      setSaving(true);
      setError(null);
      await elderService.update(elderId, updatedData);
      setSuccess('Profile updated successfully!');
      await loadProfile();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(`Failed to update profile: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      ACTIVE: { variant: 'success', text: 'Active' },
      INACTIVE: { variant: 'default', text: 'Inactive' },
      HOSPITALIZED: { variant: 'warning', text: 'Hospitalized' },
    };
    return variants[status] || { variant: 'default', text: 'Unknown' };
  };

  if (loading) {
    return <Loading variant="spinner" size="lg" fullScreen text="Loading profile..." />;
  }

  if (!profile) {
    return (
      <Container size="lg" className="py-12">
        <Alert type="error">Elder profile not found</Alert>
      </Container>
    );
  }

  const statusBadge = getStatusBadge(profile.status);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      <Container size="xl" className="py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <User className="w-10 h-10" />
                Elder Profile Management
              </h1>
              <p className="text-blue-200">
                Manage elder information, contacts, and medical history
              </p>
            </div>
            <Badge variant={statusBadge.variant} className="text-lg px-4 py-2">
              {statusBadge.text}
            </Badge>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <Alert type="error" dismissible onDismiss={() => setError(null)} className="mb-6">
            {error}
          </Alert>
        )}
        {success && (
          <Alert type="success" dismissible onDismiss={() => setSuccess(null)} className="mb-6">
            {success}
          </Alert>
        )}

        {/* Profile Photo Section */}
        <Card padding="normal" className="mb-6 bg-white/10 backdrop-blur-md border-white/20">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <ProfilePhotoUpload
              currentPhoto={profile.user?.profilePhoto}
              onUpload={(photoUrl) => handleSave({ profilePhoto: photoUrl })}
            />
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl font-bold text-white mb-1">
                {profile.user?.firstName} {profile.user?.lastName}
              </h2>
              <p className="text-gray-300 mb-2">{profile.user?.email}</p>
              <p className="text-gray-400 text-sm">
                Medical Record: {profile.medicalRecordNo}
              </p>
              <p className="text-gray-400 text-sm">
                Member since: {new Date(profile.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </Card>

        {/* Navigation Tabs */}
        <Card padding="sm" className="mb-6 bg-white/10 backdrop-blur-md border-white/20">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Tab Content */}
        <div className="animate-fadeIn">
          {activeTab === 'basic' && (
            <BasicInfoForm
              profile={profile}
              onSave={handleSave}
              saving={saving}
            />
          )}

          {activeTab === 'emergency' && (
            <EmergencyContactManager
              contacts={profile.emergencyContact || []}
              onSave={(contacts) => handleSave({ emergencyContact: contacts })}
              saving={saving}
            />
          )}

          {activeTab === 'medical' && (
            <MedicalHistoryForm
              profile={profile}
              onSave={handleSave}
              saving={saving}
            />
          )}

          {activeTab === 'family' && (
            <FamilyMemberManager
              elderId={elderId}
              profile={profile}
            />
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
          <Card padding="normal" className="bg-white/10 backdrop-blur-md border-white/20">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <FileText className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-gray-300 text-sm">Appointments</p>
                <p className="text-2xl font-bold text-white">
                  {profile.appointments?.length || 0}
                </p>
              </div>
            </div>
          </Card>

          <Card padding="normal" className="bg-white/10 backdrop-blur-md border-white/20">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <Heart className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-gray-300 text-sm">Medications</p>
                <p className="text-2xl font-bold text-white">
                  {profile.medications?.length || 0}
                </p>
              </div>
            </div>
          </Card>

          <Card padding="normal" className="bg-white/10 backdrop-blur-md border-white/20">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <Phone className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-gray-300 text-sm">Emergency Contacts</p>
                <p className="text-2xl font-bold text-white">
                  {Array.isArray(profile.emergencyContact) ? profile.emergencyContact.length : 0}
                </p>
              </div>
            </div>
          </Card>

          <Card padding="normal" className="bg-white/10 backdrop-blur-md border-white/20">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-500/20 rounded-lg">
                <Users className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <p className="text-gray-300 text-sm">Vital Readings</p>
                <p className="text-2xl font-bold text-white">
                  {profile.vitals?.length || 0}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </Container>
    </div>
  );
};

export default ElderProfilePage;
