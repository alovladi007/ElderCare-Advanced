const express = require('express');
const router = express.Router();

// Service data
const services = {
  elderCare: {
    id: 'elder-care',
    name: 'Elder Care Services',
    description: 'Comprehensive care for seniors',
    services: [
      { name: '24/7 Personal Care', price: 'Contact for pricing' },
      { name: 'Medication Management', price: 'Contact for pricing' },
      { name: 'Memory Care', price: 'Contact for pricing' },
      { name: 'Health Monitoring', price: 'Contact for pricing' }
    ]
  },
  homeCare: {
    id: 'home-care',
    name: 'Home Care Services',
    description: 'Personalized in-home care',
    services: [
      { name: 'Personal Care Assistance', price: 'Starting at $25/hr' },
      { name: 'Companionship', price: 'Starting at $20/hr' },
      { name: 'Meal Preparation', price: 'Starting at $30/hr' },
      { name: 'Light Housekeeping', price: 'Starting at $25/hr' }
    ]
  },
  repairs: {
    id: 'repair-services',
    name: 'Home Repair & Maintenance',
    description: 'Professional home repair services',
    services: [
      { name: 'General Repairs', price: 'Starting at $75/hr' },
      { name: 'Electrical Work', price: 'Starting at $100/hr' },
      { name: 'Plumbing Services', price: 'Starting at $95/hr' },
      { name: 'Safety Modifications', price: 'Contact for pricing' }
    ]
  }
};

// Get all services
router.get('/', (req, res) => {
  res.json({
    status: 'success',
    data: services
  });
});

// Get specific service
router.get('/:serviceId', (req, res) => {
  const service = Object.values(services).find(s => s.id === req.params.serviceId);
  if (!service) {
    return res.status(404).json({
      status: 'error',
      message: 'Service not found'
    });
  }
  res.json({
    status: 'success',
    data: service
  });
});

module.exports = router;
