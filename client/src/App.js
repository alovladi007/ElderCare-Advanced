import React, { Suspense, lazy } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Eager-loaded pages (needed immediately)
import HomePage from './pages/HomePage';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import InstallPrompt from './components/InstallPrompt';

// Lazy-loaded pages (loaded on demand) - Dashboards & Auth
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const UnifiedDashboard = lazy(() => import('./pages/UnifiedDashboard'));
const ElderPortalDashboard = lazy(() => import('./pages/ElderPortalDashboard'));
const EmployeeLoginPage = lazy(() => import('./pages/EmployeeLoginPage'));
const EmployeeDashboard = lazy(() => import('./pages/EmployeeDashboard'));
const MonitoringLoginPage = lazy(() => import('./pages/MonitoringLoginPage'));
const MonitoringDashboard = lazy(() => import('./pages/MonitoringDashboard'));
const SmartHomeDashboard = lazy(() => import('./pages/SmartHomeDashboard'));
const SmartHomeRedirectPage = lazy(() => import('./pages/SmartHomeRedirectPage'));
const SmartHomeHub = lazy(() => import('./pages/smart-home/SmartHomeHub'));
const ElderProfilePage = lazy(() => import('./pages/elder/ElderProfilePage'));
const CareManagementDashboard = lazy(() => import('./pages/care/CareManagementDashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

// Lazy-loaded service pages
const ElderCarePage = lazy(() => import('./pages/ElderCarePage'));
const HomeCarePage = lazy(() => import('./pages/HomeCarePage'));
const RepairServicesPage = lazy(() => import('./pages/RepairServicesPage'));
const SmartHomeServicesPage = lazy(() => import('./pages/SmartHomeServicesPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const BookingPage = lazy(() => import('./pages/BookingPage'));
const CareGuidePage = lazy(() => import('./pages/CareGuidePage'));
const FAQPage = lazy(() => import('./pages/FAQPage'));
const TestimonialsPage = lazy(() => import('./pages/TestimonialsPage'));
const BlogPage = lazy(() => import('./pages/BlogPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const TermsOfServicePage = lazy(() => import('./pages/TermsOfServicePage'));

// Lazy-loaded repair service pages
const GeneralRepairsPage = lazy(() => import('./pages/GeneralRepairsPage'));
const ElectricalWorkPage = lazy(() => import('./pages/ElectricalWorkPage'));
const PlumbingServicesPage = lazy(() => import('./pages/PlumbingServicesPage'));
const SafetyModificationsPage = lazy(() => import('./pages/SafetyModificationsPage'));
const SecurityUpgradesPage = lazy(() => import('./pages/SecurityUpgradesPage'));
const HandymanServicesPage = lazy(() => import('./pages/HandymanServicesPage'));

// Lazy-loaded elder care service pages
const PersonalCarePage = lazy(() => import('./pages/PersonalCarePage'));
const CompanionshipPage = lazy(() => import('./pages/CompanionshipPage'));
const MealPreparationPage = lazy(() => import('./pages/MealPreparationPage'));
const LightHousekeepingPage = lazy(() => import('./pages/LightHousekeepingPage'));
const SafetySupervisionPage = lazy(() => import('./pages/SafetySupervisionPage'));
const TwentyFourSevenCarePage = lazy(() => import('./pages/TwentyFourSevenCarePage'));
const MedicationManagementPage = lazy(() => import('./pages/MedicationManagementPage'));
const MemoryCarePage = lazy(() => import('./pages/MemoryCarePage'));
const HealthMonitoringPage = lazy(() => import('./pages/HealthMonitoringPage'));
const NutritionMealPrepPage = lazy(() => import('./pages/NutritionMealPrepPage'));
const ElderCompanionshipPage = lazy(() => import('./pages/ElderCompanionshipPage'));
const RemoteHealthMonitoringPage = lazy(() => import('./pages/RemoteHealthMonitoringPage'));

// Loading fallback component
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-purple-900">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white mb-4"></div>
      <p className="text-white text-xl">Loading...</p>
    </div>
  </div>
);

function App() {
  return (
    <Router>
      <div className="App min-h-screen flex flex-col">
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* Auth Routes (No Navbar/Footer) */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/dashboard" element={<UnifiedDashboard />} />
            <Route path="/elder-dashboard" element={<ElderPortalDashboard />} />
            <Route path="/elder-profile/:elderId" element={<ElderProfilePage />} />
            <Route path="/care-management/:elderId" element={<CareManagementDashboard />} />

            {/* Employee Routes (No Navbar/Footer) */}
            <Route path="/employee-login" element={<EmployeeLoginPage />} />
            <Route path="/employee-dashboard" element={<EmployeeDashboard />} />

            {/* Monitoring System Routes (No Navbar/Footer) */}
            <Route path="/monitoring/login" element={<MonitoringLoginPage />} />
            <Route path="/monitoring/dashboard" element={<MonitoringDashboard />} />

            {/* Smart Home Routes (No Navbar/Footer) */}
            <Route path="/smart-home-dashboard" element={<SmartHomeDashboard />} />
            <Route path="/smart-home-hub" element={<SmartHomeHub />} />
            <Route path="/smart-home" element={<SmartHomeRedirectPage />} />

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
                    <Route path="/smart-home-services" element={<SmartHomeServicesPage />} />
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
        </Suspense>
        <InstallPrompt />
        <ToastContainer position="top-right" autoClose={5000} />
      </div>
    </Router>
  );
}

export default App;
