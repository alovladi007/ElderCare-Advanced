import React, { useState } from 'react';
import { ArrowLeft, Calendar, Clock, User, Mail, Phone, MapPin } from 'lucide-react';
import { Card, Badge, Button, Input, Select, TextArea, Alert } from '..';

const BookingForm = ({ service, onSubmit, onBack }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    preferredDate: '',
    preferredTime: 'MORNING',
    address: '',
    specialNeeds: '',
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    if (!formData.preferredDate) {
      newErrors.preferredDate = 'Preferred date is required';
    } else {
      const selectedDate = new Date(formData.preferredDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        newErrors.preferredDate = 'Date cannot be in the past';
      }
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      ...formData,
      serviceId: service.id,
      serviceType: service.type,
    });
  };

  return (
    <div className="space-y-6">
      {/* Service Summary */}
      <Card padding="normal" className="bg-white/10 backdrop-blur-md border-white/20">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white mb-2">{service.name}</h2>
            <p className="text-gray-400 mb-4">{service.description}</p>
            <div className="flex items-center gap-4">
              {service.price && (
                <Badge variant="success" className="text-lg px-4 py-2">
                  ${service.price}
                </Badge>
              )}
              {service.duration && (
                <div className="flex items-center gap-2 text-gray-300">
                  <Clock className="w-5 h-5" />
                  <span>{service.duration} minutes</span>
                </div>
              )}
            </div>
          </div>
          <Button variant="ghost" icon={ArrowLeft} onClick={onBack} className="bg-white/5">
            Back
          </Button>
        </div>
      </Card>

      {/* Booking Form */}
      <Card padding="normal" className="bg-white/10 backdrop-blur-md border-white/20">
        <h3 className="text-xl font-bold text-white mb-6">Booking Information</h3>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h4 className="text-white font-semibold flex items-center gap-2">
              <User className="w-5 h-5" />
              Personal Information
            </h4>

            <Input
              label="Full Name"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Enter your full name"
              error={errors.fullName}
              required
              inputClassName="bg-white/10 border-white/20 text-white placeholder-gray-400"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Email Address"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your.email@example.com"
                icon={Mail}
                error={errors.email}
                required
                inputClassName="bg-white/10 border-white/20 text-white placeholder-gray-400"
              />

              <Input
                label="Phone Number"
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+1 (555) 123-4567"
                icon={Phone}
                error={errors.phone}
                required
                inputClassName="bg-white/10 border-white/20 text-white placeholder-gray-400"
              />
            </div>
          </div>

          {/* Schedule */}
          <div className="space-y-4">
            <h4 className="text-white font-semibold flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Preferred Schedule
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Preferred Date"
                type="date"
                name="preferredDate"
                value={formData.preferredDate}
                onChange={handleChange}
                error={errors.preferredDate}
                required
                inputClassName="bg-white/10 border-white/20 text-white"
              />

              <Select
                label="Preferred Time"
                name="preferredTime"
                value={formData.preferredTime}
                onChange={handleChange}
                options={[
                  { value: 'MORNING', label: 'Morning (8AM - 12PM)' },
                  { value: 'AFTERNOON', label: 'Afternoon (12PM - 5PM)' },
                  { value: 'EVENING', label: 'Evening (5PM - 8PM)' },
                ]}
                className="mb-0"
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-4">
            <h4 className="text-white font-semibold flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Service Location
            </h4>

            <TextArea
              label="Address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Enter service address..."
              rows={3}
              error={errors.address}
              required
              inputClassName="bg-white/10 border-white/20 text-white placeholder-gray-400"
            />
          </div>

          {/* Special Requirements */}
          <TextArea
            label="Special Needs or Requirements (Optional)"
            name="specialNeeds"
            value={formData.specialNeeds}
            onChange={handleChange}
            placeholder="Any special requirements or notes..."
            rows={4}
            helperText="Please describe any special needs, medical conditions, or specific requirements"
            inputClassName="bg-white/10 border-white/20 text-white placeholder-gray-400"
          />

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={onBack}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="lg">
              Continue to Payment
            </Button>
          </div>
        </form>
      </Card>

      {/* Info Alert */}
      <Alert type="info">
        <p className="text-sm">
          <strong>Note:</strong> Your booking will be confirmed after payment is processed.
          You will receive a confirmation email with all the details.
        </p>
      </Alert>
    </div>
  );
};

export default BookingForm;
