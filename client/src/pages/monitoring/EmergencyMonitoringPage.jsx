import React from 'react';
import { useParams } from 'react-router-dom';
import EmergencyMonitoringDashboard from '../../components/monitoring/EmergencyMonitoringDashboard';

const EmergencyMonitoringPage = () => {
  const { elderId } = useParams();

  return <EmergencyMonitoringDashboard elderId={elderId} />;
};

export default EmergencyMonitoringPage;
