import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Pages
import HomePage from './pages/HomePage';
import ElderCarePage from './pages/ElderCarePage';
import HomeCarePage from './pages/HomeCarePage';
import RepairServicesPage from './pages/RepairServicesPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import BookingPage from './pages/BookingPage';
import AdminDashboard from './pages/AdminDashboard';
import EmployeeLoginPage from './pages/EmployeeLoginPage';
import EmployeeDashboard from './pages/EmployeeDashboard';
import CareGuidePage from './pages/CareGuidePage';
import FAQPage from './pages/FAQPage';
import TestimonialsPage from './pages/TestimonialsPage';
import BlogPage from './pages/BlogPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import GeneralRepairsPage from './pages/GeneralRepairsPage';
import ElectricalWorkPage from './pages/ElectricalWorkPage';
import PlumbingServicesPage from './pages/PlumbingServicesPage';
import SafetyModificationsPage from './pages/SafetyModificationsPage';
import SecurityUpgradesPage from './pages/SecurityUpgradesPage';
import HandymanServicesPage from './pages/HandymanServicesPage';
import PersonalCarePage from './pages/PersonalCarePage';
import CompanionshipPage from './pages/CompanionshipPage';
import MealPreparationPage from './pages/MealPreparationPage';
import LightHousekeepingPage from './pages/LightHousekeepingPage';
import SafetySupervisionPage from './pages/SafetySupervisionPage';
import TwentyFourSevenCarePage from './pages/TwentyFourSevenCarePage';
import MedicationManagementPage from './pages/MedicationManagementPage';
import MemoryCarePage from './pages/MemoryCarePage';
import HealthMonitoringPage from './pages/HealthMonitoringPage';
import NutritionMealPrepPage from './pages/NutritionMealPrepPage';
import ElderCompanionshipPage from './pages/ElderCompanionshipPage';
import RemoteHealthMonitoringPage from './pages/RemoteHealthMonitoringPage';
import MonitoringLoginPage from './pages/MonitoringLoginPage';
import MonitoringDashboard from './pages/MonitoringDashboard';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import InstallPrompt from './components/InstallPrompt';

function App() {
  return (
    <Router>
      <div className="App min-h-screen flex flex-col">
        <Routes>
          {/* Employee Routes (No Navbar/Footer) */}
          <Route path="/employee-login" element={<EmployeeLoginPage />} />
          <Route path="/employee-dashboard" element={<EmployeeDashboard />} />

          {/* Monitoring System Routes (No Navbar/Footer) */}
          <Route path="/monitoring/login" element={<MonitoringLoginPage />} />
          <Route path="/monitoring/dashboard" element={<MonitoringDashboard />} />

          {/* Public Routes (With Navbar/Footer) */}
          <Route path="/*" element={
            <>
              <Navbar />
              <main className="flex-grow">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/elder-care" element={<ElderCarePage />} />
                  <Route path="/home-care" element={<HomeCarePage />} />
                  <Route path="/repair-services" element={<RepairServicesPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/booking" element={<BookingPage />} />
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/care-guide" element={<CareGuidePage />} />
                  <Route path="/faq" element={<FAQPage />} />
                  <Route path="/testimonials" element={<TestimonialsPage />} />
                  <Route path="/blog" element={<BlogPage />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                  <Route path="/terms-of-service" element={<TermsOfServicePage />} />
                  <Route path="/general-repairs" element={<GeneralRepairsPage />} />
                  <Route path="/electrical-work" element={<ElectricalWorkPage />} />
                  <Route path="/plumbing-services" element={<PlumbingServicesPage />} />
                  <Route path="/safety-modifications" element={<SafetyModificationsPage />} />
                  <Route path="/security-upgrades" element={<SecurityUpgradesPage />} />
                  <Route path="/handyman-services" element={<HandymanServicesPage />} />
                  <Route path="/personal-care" element={<PersonalCarePage />} />
                  <Route path="/companionship" element={<CompanionshipPage />} />
                  <Route path="/meal-preparation" element={<MealPreparationPage />} />
                  <Route path="/light-housekeeping" element={<LightHousekeepingPage />} />
                  <Route path="/safety-supervision" element={<SafetySupervisionPage />} />
                  <Route path="/24-7-care" element={<TwentyFourSevenCarePage />} />
                  <Route path="/remote-health-monitoring" element={<RemoteHealthMonitoringPage />} />
                  <Route path="/medication-management" element={<MedicationManagementPage />} />
                  <Route path="/memory-care" element={<MemoryCarePage />} />
                  <Route path="/health-monitoring" element={<HealthMonitoringPage />} />
                  <Route path="/nutrition-meal-prep" element={<NutritionMealPrepPage />} />
                  <Route path="/elder-companionship" element={<ElderCompanionshipPage />} />
                </Routes>
              </main>
              <Footer />
            </>
          } />
        </Routes>
        <InstallPrompt />
        <ToastContainer position="top-right" autoClose={5000} />
      </div>
    </Router>
  );
}

export default App;
