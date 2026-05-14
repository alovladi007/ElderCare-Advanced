import React, { useState } from 'react';
import { Heart, Calendar, Pill, ClipboardList, Activity } from 'lucide-react';
import { Container, Card } from '../../components';
import MedicationSchedule from '../../components/care/MedicationSchedule';
import AppointmentCalendar from '../../components/care/AppointmentCalendar';
import VitalSignsCharts from '../../components/care/VitalSignsCharts';
import CareTaskList from '../../components/care/CareTaskList';
import CareOverview from '../../components/care/CareOverview';

const CareManagementDashboard = ({ elderId }) => {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'medications', label: 'Medications', icon: Pill },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'vitals', label: 'Vital Signs', icon: Heart },
    { id: 'tasks', label: 'Care Tasks', icon: ClipboardList },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <CareOverview elderId={elderId} />;
      case 'medications':
        return <MedicationSchedule elderId={elderId} />;
      case 'appointments':
        return <AppointmentCalendar elderId={elderId} />;
      case 'vitals':
        return <VitalSignsCharts elderId={elderId} />;
      case 'tasks':
        return <CareTaskList elderId={elderId} />;
      default:
        return <CareOverview elderId={elderId} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <Container size="xl" className="py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Heart className="w-10 h-10" />
            Care Management Dashboard
          </h1>
          <p className="text-purple-200">
            Comprehensive care coordination and health monitoring
          </p>
        </div>

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
                      ? 'bg-purple-600 text-white shadow-lg'
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
          {renderContent()}
        </div>
      </Container>
    </div>
  );
};

export default CareManagementDashboard;
