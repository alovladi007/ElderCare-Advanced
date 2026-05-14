import React, { useState, useEffect } from 'react';
import { Plus, X, Save, AlertCircle } from 'lucide-react';
import { Card, Button, Input, TextArea, Badge } from '..';

const MedicalHistoryForm = ({ profile, onSave, saving }) => {
  const [medicalConditions, setMedicalConditions] = useState([]);
  const [allergies, setAllergies] = useState([]);
  const [newCondition, setNewCondition] = useState('');
  const [newAllergy, setNewAllergy] = useState('');

  useEffect(() => {
    if (profile) {
      setMedicalConditions(
        Array.isArray(profile.medicalConditions) ? profile.medicalConditions : []
      );
      setAllergies(Array.isArray(profile.allergies) ? profile.allergies : []);
    }
  }, [profile]);

  const handleAddCondition = (e) => {
    e.preventDefault();
    if (newCondition.trim()) {
      const updated = [...medicalConditions, newCondition.trim()];
      setMedicalConditions(updated);
      setNewCondition('');
    }
  };

  const handleRemoveCondition = (index) => {
    const updated = medicalConditions.filter((_, i) => i !== index);
    setMedicalConditions(updated);
  };

  const handleAddAllergy = (e) => {
    e.preventDefault();
    if (newAllergy.trim()) {
      const updated = [...allergies, newAllergy.trim()];
      setAllergies(updated);
      setNewAllergy('');
    }
  };

  const handleRemoveAllergy = (index) => {
    const updated = allergies.filter((_, i) => i !== index);
    setAllergies(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      medicalConditions,
      allergies,
    });
  };

  return (
    <div className="space-y-6">
      {/* Medical Conditions */}
      <Card padding="normal" className="bg-white/10 backdrop-blur-md border-white/20">
        <h2 className="text-xl font-bold text-white mb-6">Medical Conditions</h2>

        {/* Add Condition Form */}
        <form onSubmit={handleAddCondition} className="mb-6">
          <div className="flex gap-3">
            <Input
              placeholder="Enter medical condition (e.g., Diabetes, Hypertension)"
              value={newCondition}
              onChange={(e) => setNewCondition(e.target.value)}
              inputClassName="bg-white/10 border-white/20 text-white placeholder-gray-400"
              className="mb-0 flex-1"
            />
            <Button
              type="submit"
              variant="primary"
              icon={Plus}
              disabled={!newCondition.trim()}
            >
              Add
            </Button>
          </div>
        </form>

        {/* Conditions List */}
        {medicalConditions.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-400">No medical conditions recorded</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {medicalConditions.map((condition, index) => (
              <Badge
                key={index}
                variant="warning"
                className="px-3 py-2 text-sm flex items-center gap-2"
              >
                {condition}
                <button
                  type="button"
                  onClick={() => handleRemoveCondition(index)}
                  className="ml-1 hover:text-red-300 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </Card>

      {/* Allergies */}
      <Card padding="normal" className="bg-white/10 backdrop-blur-md border-white/20">
        <h2 className="text-xl font-bold text-white mb-6">Allergies</h2>

        {/* Add Allergy Form */}
        <form onSubmit={handleAddAllergy} className="mb-6">
          <div className="flex gap-3">
            <Input
              placeholder="Enter allergy (e.g., Penicillin, Peanuts, Latex)"
              value={newAllergy}
              onChange={(e) => setNewAllergy(e.target.value)}
              inputClassName="bg-white/10 border-white/20 text-white placeholder-gray-400"
              className="mb-0 flex-1"
            />
            <Button
              type="submit"
              variant="primary"
              icon={Plus}
              disabled={!newAllergy.trim()}
            >
              Add
            </Button>
          </div>
        </form>

        {/* Allergies List */}
        {allergies.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-400">No allergies recorded</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {allergies.map((allergy, index) => (
              <Badge
                key={index}
                variant="danger"
                className="px-3 py-2 text-sm flex items-center gap-2"
              >
                {allergy}
                <button
                  type="button"
                  onClick={() => handleRemoveAllergy(index)}
                  className="ml-1 hover:text-red-300 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </Card>

      {/* Important Notes */}
      <Card padding="normal" className="bg-yellow-500/10 border-yellow-500/30">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-yellow-100 font-semibold mb-2">
              Important Medical Information
            </h3>
            <ul className="text-yellow-200 text-sm space-y-1">
              <li>• This information is shared with caregivers and emergency responders</li>
              <li>• Keep medical conditions and allergies up to date</li>
              <li>• Include all known allergies, even if mild</li>
              <li>• Consult healthcare provider for accurate medical history</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          type="button"
          variant="primary"
          icon={Save}
          onClick={handleSubmit}
          loading={saving}
          disabled={saving}
          size="lg"
        >
          {saving ? 'Saving...' : 'Save Medical History'}
        </Button>
      </div>
    </div>
  );
};

export default MedicalHistoryForm;
