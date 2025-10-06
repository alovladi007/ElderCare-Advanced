import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
