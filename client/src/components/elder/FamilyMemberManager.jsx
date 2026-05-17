import React, { useState, useEffect } from 'react';
import { Users, Plus, Mail, Phone, UserCheck, UserX } from 'lucide-react';
import { Card, Button, Input, Badge, Modal, Alert } from '..';
import api from '../../services/api';

const FamilyMemberManager = ({ elderId, profile }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    relationship: '',
  });

  useEffect(() => {
    loadFamilyMembers();
  }, [elderId]);

  const loadFamilyMembers = async () => {
    try {
      setLoading(true);
      // Fetch family members linked to this elder profile
      const response = await api.get(`/elder-profile/${elderId}/family`);
      setFamilyMembers(response.data || []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load family members');
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();

    try {
      setInviting(true);
      setError(null);

      await api.post(`/elder-profile/${elderId}/family/invite`, inviteForm);

      // Reset form and close modal
      setInviteForm({
        email: '',
        firstName: '',
        lastName: '',
        relationship: '',
      });
      setShowInviteModal(false);

      // Reload family members
      await loadFamilyMembers();
    } catch (err) {
      setError(err.message || 'Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!confirm('Are you sure you want to remove this family member?')) return;

    try {
      await api.delete(`/elder-profile/${elderId}/family/${memberId}`);
      await loadFamilyMembers();
    } catch (err) {
      setError(`Failed to remove family member: ${err.message}`);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInviteForm((prev) => ({ ...prev, [name]: value }));
  };

  const getRelationshipBadge = (relationship) => {
    const variants = {
      SPOUSE: 'info',
      CHILD: 'success',
      SIBLING: 'default',
      PARENT: 'warning',
      OTHER: 'default',
    };
    return variants[relationship?.toUpperCase()] || 'default';
  };

  if (loading) {
    return (
      <Card padding="normal" className="bg-white/10 backdrop-blur-md border-white/20">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mb-4"></div>
          <p className="text-white">Loading family members...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert type="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card padding="normal" className="bg-white/10 backdrop-blur-md border-white/20">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Family Members</h2>
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => setShowInviteModal(true)}
          >
            Invite Member
          </Button>
        </div>

        {familyMembers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              No Family Members Yet
            </h3>
            <p className="text-gray-400 mb-6">
              Invite family members to collaborate on elder care
            </p>
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => setShowInviteModal(true)}
            >
              Invite First Member
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {familyMembers.map((member) => (
              <Card
                key={member.id}
                padding="normal"
                className="bg-white/5 border-white/10"
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-blue-400" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-white font-semibold truncate">
                        {member.firstName} {member.lastName}
                      </h3>
                      <Badge variant={getRelationshipBadge(member.relationship)}>
                        {member.relationship}
                      </Badge>
                    </div>

                    <div className="space-y-1 text-sm">
                      {member.email && (
                        <div className="flex items-center gap-2 text-gray-300">
                          <Mail className="w-4 h-4 text-gray-500" />
                          <span className="truncate">{member.email}</span>
                        </div>
                      )}
                      {member.phone && (
                        <div className="flex items-center gap-2 text-gray-300">
                          <Phone className="w-4 h-4 text-gray-500" />
                          <span>{member.phone}</span>
                        </div>
                      )}
                    </div>

                    {/* Status */}
                    <div className="mt-2">
                      {member.isVerified ? (
                        <Badge variant="success" className="text-xs">
                          <UserCheck className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="warning" className="text-xs">
                          Invitation Pending
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Remove Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={UserX}
                    onClick={() => handleRemoveMember(member.id)}
                    className="bg-red-500/20 text-red-300 hover:bg-red-500/30"
                    title="Remove member"
                  />
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>

      {/* Access Permissions Info */}
      <Card padding="normal" className="bg-blue-500/10 border-blue-500/30">
        <h3 className="text-blue-100 font-semibold mb-2">Family Member Access</h3>
        <ul className="text-blue-200 text-sm space-y-1">
          <li>• View elder profile and health information</li>
          <li>• Receive notifications about health alerts</li>
          <li>• View appointments and medication schedules</li>
          <li>• Communicate with caregivers</li>
          <li>• Access emergency contact information</li>
        </ul>
      </Card>

      {/* Invite Modal */}
      <Modal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title="Invite Family Member"
        size="md"
      >
        <form onSubmit={handleInvite} className="space-y-4">
          <p className="text-gray-300 text-sm mb-4">
            Send an invitation to a family member to join and collaborate on elder care.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              name="firstName"
              value={inviteForm.firstName}
              onChange={handleChange}
              placeholder="e.g., John"
              required
            />

            <Input
              label="Last Name"
              name="lastName"
              value={inviteForm.lastName}
              onChange={handleChange}
              placeholder="e.g., Doe"
              required
            />
          </div>

          <Input
            label="Email Address"
            type="email"
            name="email"
            value={inviteForm.email}
            onChange={handleChange}
            placeholder="e.g., john@example.com"
            helperText="An invitation will be sent to this email"
            required
          />

          <Input
            label="Relationship"
            name="relationship"
            value={inviteForm.relationship}
            onChange={handleChange}
            placeholder="e.g., Son, Daughter, Spouse"
            required
          />

          <div className="flex gap-3 justify-end mt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowInviteModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              icon={Mail}
              loading={inviting}
              disabled={inviting}
            >
              {inviting ? 'Sending...' : 'Send Invitation'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default FamilyMemberManager;
