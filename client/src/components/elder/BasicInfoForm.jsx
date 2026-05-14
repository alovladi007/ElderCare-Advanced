import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { Card, Button, Input, Select, TextArea } from '..';

const BasicInfoForm = ({ profile, onSave, saving }) => {
  const [formData, setFormData] = useState({
    dateOfBirth: '',
    gender: '',
    address: '',
    notes: '',
    status: 'ACTIVE',
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.split('T')[0] : '',
        gender: profile.gender || '',
        address: profile.address || '',
        notes: profile.notes || '',
        status: profile.status || 'ACTIVE',
      });
    }
  }, [profile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Card padding="normal" className="bg-white/10 backdrop-blur-md border-white/20">
      <h2 className="text-xl font-bold text-white mb-6">Basic Information</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Date of Birth */}
          <Input
            label="Date of Birth"
            type="date"
            name="dateOfBirth"
            value={formData.dateOfBirth}
            onChange={handleChange}
            required
            inputClassName="bg-white/10 border-white/20 text-white"
          />

          {/* Gender */}
          <Select
            label="Gender"
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            options={[
              { value: '', label: 'Select gender' },
              { value: 'MALE', label: 'Male' },
              { value: 'FEMALE', label: 'Female' },
              { value: 'OTHER', label: 'Other' },
              { value: 'PREFER_NOT_TO_SAY', label: 'Prefer not to say' },
            ]}
            required
            className="mb-0"
          />

          {/* Status */}
          <Select
            label="Status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            options={[
              { value: 'ACTIVE', label: 'Active' },
              { value: 'INACTIVE', label: 'Inactive' },
              { value: 'HOSPITALIZED', label: 'Hospitalized' },
            ]}
            className="mb-0"
          />
        </div>

        {/* Address */}
        <TextArea
          label="Address"
          name="address"
          value={formData.address}
          onChange={handleChange}
          rows={3}
          placeholder="Enter full address..."
          inputClassName="bg-white/10 border-white/20 text-white placeholder-gray-400"
        />

        {/* Notes */}
        <TextArea
          label="Notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={4}
          placeholder="Additional notes about the elder (preferences, special needs, etc.)..."
          helperText="Private notes for caregivers and family members"
          inputClassName="bg-white/10 border-white/20 text-white placeholder-gray-400"
        />

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            icon={Save}
            loading={saving}
            disabled={saving}
            size="lg"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default BasicInfoForm;
