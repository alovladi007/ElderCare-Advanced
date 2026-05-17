import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * Elder Portal Dashboard - Redirects to Unified Dashboard
 * This provides a dedicated entry point for elder users
 */
const ElderPortalDashboard = () => {
  return <Navigate to="/dashboard" replace />;
};

export default ElderPortalDashboard;
