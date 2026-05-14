import api from './api';

const bookingService = {
  // Services
  getServices: async () => {
    return await api.get('/services');
  },

  getServiceById: async (serviceId) => {
    return await api.get(`/services/${serviceId}`);
  },

  // Bookings
  createBooking: async (data) => {
    return await api.post('/bookings', data);
  },

  getBookings: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return await api.get(`/bookings?${query}`);
  },

  getBookingById: async (bookingId) => {
    return await api.get(`/bookings/${bookingId}`);
  },

  updateBooking: async (bookingId, data) => {
    return await api.patch(`/bookings/${bookingId}`, data);
  },

  cancelBooking: async (bookingId) => {
    return await api.delete(`/bookings/${bookingId}`);
  },

  // Payments
  getStripeConfig: async () => {
    return await api.get('/payments/config');
  },

  createPaymentIntent: async (data) => {
    return await api.post('/payments/payment-intent', data);
  },

  getPaymentIntent: async (paymentIntentId) => {
    return await api.get(`/payments/payment-intent/${paymentIntentId}`);
  },

  getPaymentHistory: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return await api.get(`/payments/history?${query}`);
  },

  getInvoice: async (invoiceId) => {
    return await api.get(`/payments/invoice/${invoiceId}`);
  },

  downloadInvoice: async (invoiceId) => {
    const response = await fetch(`/api/payments/invoice/${invoiceId}/download`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
      },
    });
    return response.blob();
  },

  // Stripe webhook (for testing)
  handleWebhook: async (event) => {
    return await api.post('/payments/webhook', event);
  },
};

export default bookingService;
