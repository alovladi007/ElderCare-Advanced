import React, { useState } from 'react';
import { Calendar, CreditCard, FileText, ShoppingCart } from 'lucide-react';
import { Container, Card } from '../../components';
import ServiceSelector from '../../components/booking/ServiceSelector';
import BookingForm from '../../components/booking/BookingForm';
import PaymentCheckout from '../../components/booking/PaymentCheckout';
import PaymentHistory from '../../components/booking/PaymentHistory';

const BookingDashboard = () => {
  const [activeTab, setActiveTab] = useState('services');
  const [selectedService, setSelectedService] = useState(null);
  const [bookingData, setBookingData] = useState(null);

  const tabs = [
    { id: 'services', label: 'Browse Services', icon: ShoppingCart },
    { id: 'bookings', label: 'My Bookings', icon: Calendar },
    { id: 'payments', label: 'Payment History', icon: CreditCard },
    { id: 'invoices', label: 'Invoices', icon: FileText },
  ];

  const handleServiceSelect = (service) => {
    setSelectedService(service);
    setActiveTab('booking');
  };

  const handleBookingSubmit = (data) => {
    setBookingData({ ...data, service: selectedService });
    setActiveTab('checkout');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'services':
        return <ServiceSelector onSelectService={handleServiceSelect} />;
      case 'booking':
        return (
          <BookingForm
            service={selectedService}
            onSubmit={handleBookingSubmit}
            onBack={() => setActiveTab('services')}
          />
        );
      case 'checkout':
        return (
          <PaymentCheckout
            bookingData={bookingData}
            onBack={() => setActiveTab('booking')}
            onSuccess={() => setActiveTab('bookings')}
          />
        );
      case 'bookings':
        return <PaymentHistory viewMode="bookings" />;
      case 'payments':
        return <PaymentHistory viewMode="payments" />;
      case 'invoices':
        return <PaymentHistory viewMode="invoices" />;
      default:
        return <ServiceSelector onSelectService={handleServiceSelect} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-gray-900">
      <Container size="xl" className="py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <ShoppingCart className="w-10 h-10" />
            Booking & Payments
          </h1>
          <p className="text-indigo-200">
            Book elder care services and manage your payments
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
                      ? 'bg-indigo-600 text-white shadow-lg'
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

export default BookingDashboard;
