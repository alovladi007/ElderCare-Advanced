import React, { useState } from 'react';
import { Home, Zap, Shield, Bell, Settings as SettingsIcon } from 'lucide-react';
import { Container, Card } from '../../components';
import DeviceControlPanel from '../../components/smart-home/DeviceControlPanel';
import AutomationBuilder from '../../components/smart-home/AutomationBuilder';
import EmergencyScenarios from '../../components/smart-home/EmergencyScenarios';
import AlertCenter from '../../components/smart-home/AlertCenter';
import DashboardOverview from '../../components/smart-home/DashboardOverview';

const SmartHomeHub = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [homeId] = useState('home-123'); // From auth context in real app

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'devices', label: 'Devices', icon: SettingsIcon },
    { id: 'automation', label: 'Automation', icon: Zap },
    { id: 'emergency', label: 'Emergency', icon: Shield },
    { id: 'alerts', label: 'Alerts', icon: Bell },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <DashboardOverview homeId={homeId} />;
      case 'devices':
        return <DeviceControlPanel homeId={homeId} />;
      case 'automation':
        return <AutomationBuilder homeId={homeId} />;
      case 'emergency':
        return <EmergencyScenarios homeId={homeId} />;
      case 'alerts':
        return <AlertCenter homeId={homeId} />;
      default:
        return <DashboardOverview homeId={homeId} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      <Container size="xl" className="py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Home className="w-10 h-10" />
            Smart Home Hub
          </h1>
          <p className="text-blue-200">
            Complete control center for your elder care smart home system
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
          {renderContent()}
        </div>
      </Container>
    </div>
  );
};

export default SmartHomeHub;
