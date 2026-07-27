import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Phone, Save, X } from 'lucide-react';
import { Card, Button, Input, Badge, Modal } from '..';

const EmergencyContactManager = ({ contacts, onSave, saving }) => {
  const [contactList, setContactList] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    relationship: '',
    phone: '',
    email: '',
    isPrimary: false,
  });

  useEffect(() => {
    setContactList(Array.isArray(contacts) ? contacts : []);
  }, [contacts]);

  const handleAdd = () => {
    setEditingIndex(null);
    setFormData({
      name: '',
      relationship: '',
      phone: '',
      email: '',
      isPrimary: false,
    });
    setShowModal(true);
  };

  const handleEdit = (index) => {
    setEditingIndex(index);
    setFormData(contactList[index]);
    setShowModal(true);
  };

  const handleDelete = (index) => {
    if (!window.confirm('Are you sure you want to delete this emergency contact?')) return;

    const updated = contactList.filter((_, i) => i !== index);
    setContactList(updated);
    onSave(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    let updated;
    if (editingIndex !== null) {
      // Update existing contact
      updated = contactList.map((contact, i) =>
        i === editingIndex ? formData : contact
      );
    } else {
      // Add new contact
      updated = [...contactList, formData];
    }

    // If setting as primary, remove primary from others
    if (formData.isPrimary) {
      updated = updated.map((contact, i) => ({
        ...contact,
        isPrimary: editingIndex !== null
          ? i === editingIndex
          : i === updated.length - 1,
      }));
    }

    setContactList(updated);
    onSave(updated);
    setShowModal(false);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  return (
    <Card padding="normal" className="bg-white/10 backdrop-blur-md border-white/20">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Emergency Contacts</h2>
        <Button variant="primary" icon={Plus} onClick={handleAdd}>
          Add Contact
        </Button>
      </div>

      {contactList.length === 0 ? (
        <div className="text-center py-12">
          <Phone className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            No Emergency Contacts Yet
          </h3>
          <p className="text-gray-400 mb-6">
            Add emergency contacts to be notified in case of an emergency
          </p>
          <Button variant="primary" icon={Plus} onClick={handleAdd}>
            Add First Contact
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {contactList.map((contact, index) => (
            <Card
              key={index}
              padding="normal"
              className="bg-white/5 border-white/10"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-white font-semibold">{contact.name}</h3>
                    {contact.isPrimary && (
                      <Badge variant="success">Primary Contact</Badge>
                    )}
                  </div>
                  <div className="space-y-1 text-sm">
                    <p className="text-gray-300">
                      <span className="text-gray-500">Relationship:</span>{' '}
                      {contact.relationship}
                    </p>
                    <p className="text-gray-300">
                      <span className="text-gray-500">Phone:</span> {contact.phone}
                    </p>
                    {contact.email && (
                      <p className="text-gray-300">
                        <span className="text-gray-500">Email:</span> {contact.email}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Edit}
                    onClick={() => handleEdit(index)}
                    className="bg-white/5 text-white hover:bg-white/10"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Trash2}
                    onClick={() => handleDelete(index)}
                    className="bg-red-500/20 text-red-300 hover:bg-red-500/30"
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingIndex !== null ? 'Edit Emergency Contact' : 'Add Emergency Contact'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., John Doe"
            required
          />

          <Input
            label="Relationship"
            name="relationship"
            value={formData.relationship}
            onChange={handleChange}
            placeholder="e.g., Son, Daughter, Spouse"
            required
          />

          <Input
            label="Phone Number"
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="e.g., +1 (555) 123-4567"
            required
          />

          <Input
            label="Email (Optional)"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="e.g., john@example.com"
          />

          <div className="flex items-center gap-3 p-4 bg-white/5 rounded-lg">
            <input
              type="checkbox"
              id="isPrimary"
              name="isPrimary"
              checked={formData.isPrimary}
              onChange={handleChange}
              className="w-5 h-5 bg-white/10 border-white/20 rounded text-blue-600 focus:ring-2 focus:ring-blue-500"
            />
            <label htmlFor="isPrimary" className="text-white font-medium cursor-pointer">
              Set as primary emergency contact
            </label>
          </div>

          <div className="flex gap-3 justify-end mt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" icon={Save}>
              {editingIndex !== null ? 'Update Contact' : 'Add Contact'}
            </Button>
          </div>
        </form>
      </Modal>
    </Card>
  );
};

export default EmergencyContactManager;
