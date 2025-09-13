// components/Team/InviteModal.tsx
import React, { useState } from 'react';
import { UserPlus, Upload, Mail, Users, AlertCircle, Check } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Card } from '../ui/Card';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
  onInviteSent: (invites: { email: string; role: string }[]) => void;
}

type InviteMode = 'single' | 'bulk' | 'csv';

interface Invite {
  email: string;
  role: string;
  status: 'pending' | 'sending' | 'sent' | 'error';
  error?: string;
}

export const InviteModal: React.FC<InviteModalProps> = ({
  isOpen,
  onClose,
  teamId,
  onInviteSent
}) => {
  const [mode, setMode] = useState<InviteMode>('single');
  const [invites, setInvites] = useState<Invite[]>([]);
  const [singleEmail, setSingleEmail] = useState('');
  const [singleRole, setSingleRole] = useState('viewer');
  const [bulkEmails, setBulkEmails] = useState('');
  const [bulkRole, setBulkRole] = useState('viewer');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<Invite[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState('');

  const roleOptions = [
    { value: 'viewer', label: 'Viewer - Can view events and calendars' },
    { value: 'editor', label: 'Editor - Can create and edit events' },
    { value: 'admin', label: 'Admin - Can manage team and members' }
  ];

  const handleSingleInvite = () => {
    if (!singleEmail || !isValidEmail(singleEmail)) return;
    
    const newInvite: Invite = {
      email: singleEmail,
      role: singleRole,
      status: 'pending'
    };
    
    setInvites([newInvite]);
    setSingleEmail('');
    processInvites([newInvite]);
  };

  const handleBulkInvites = () => {
    const emails = bulkEmails.split(/[,\n]/).map(email => email.trim()).filter(email => email);
    const validEmails = emails.filter(isValidEmail);
    
    if (validEmails.length === 0) return;
    
    const newInvites: Invite[] = validEmails.map(email => ({
      email,
      role: bulkRole,
      status: 'pending' as const
    }));
    
    setInvites(newInvites);
    setBulkEmails('');
    processInvites(newInvites);
  };

  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setCsvFile(file);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const lines = content.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      const emailIndex = headers.findIndex(h => h.includes('email'));
      const roleIndex = headers.findIndex(h => h.includes('role'));
      
      if (emailIndex === -1) {
        alert('CSV must contain an email column');
        return;
      }
      
      const parsedData: Invite[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length > emailIndex && values[emailIndex]) {
          const email = values[emailIndex];
          const role = roleIndex !== -1 && values[roleIndex] ? 
            (values[roleIndex].toLowerCase() || 'viewer') : 'viewer';
          
          if (isValidEmail(email)) {
            parsedData.push({
              email,
              role: ['viewer', 'editor', 'admin'].includes(role) ? role : 'viewer',
              status: 'pending'
            });
          }
        }
      }
      
      setCsvData(parsedData);
    };
    
    reader.readAsText(file);
  };

  const processCsvInvites = () => {
    if (csvData.length === 0) return;
    
    setInvites(csvData);
    processInvites(csvData);
  };

  const processInvites = async (invitesToProcess: Invite[]) => {
    setIsProcessing(true);
    
    const updatedInvites = [...invitesToProcess];
    
    for (let i = 0; i < updatedInvites.length; i++) {
      updatedInvites[i].status = 'sending';
      setInvites([...updatedInvites]);
      
      try {
        const response = await fetch('/api/team/invite', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': 'demo-user' // Replace with actual user ID
          },
          body: JSON.stringify({
            teamId,
            email: updatedInvites[i].email,
            role: updatedInvites[i].role,
            message
          })
        });
        
        if (response.ok) {
          updatedInvites[i].status = 'sent';
        } else {
          const error = await response.json();
          updatedInvites[i].status = 'error';
          updatedInvites[i].error = error.error || 'Failed to send invite';
        }
      } catch (error) {
        updatedInvites[i].status = 'error';
        updatedInvites[i].error = 'Network error';
      }
      
      setInvites([...updatedInvites]);
      
      // Small delay to avoid overwhelming the server
      if (i < updatedInvites.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    setIsProcessing(false);
    
    // Notify parent component
    const successfulInvites = updatedInvites.filter(inv => inv.status === 'sent');
    if (successfulInvites.length > 0) {
      onInviteSent(successfulInvites.map(inv => ({ email: inv.email, role: inv.role })));
    }
  };

  const isValidEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleClose = () => {
    setMode('single');
    setInvites([]);
    setSingleEmail('');
    setBulkEmails('');
    setCsvFile(null);
    setCsvData([]);
    setMessage('');
    onClose();
  };

  const getStatusIcon = (status: Invite['status']) => {
    switch (status) {
      case 'sending':
        return <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />;
      case 'sent':
        return <Check className="w-4 h-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Mail className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Invite Team Members" size="lg">
      <div className="space-y-6">
        {/* Mode Selection */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setMode('single')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              mode === 'single' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <UserPlus className="w-4 h-4 mr-2 inline" />
            Single Invite
          </button>
          <button
            onClick={() => setMode('bulk')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              mode === 'bulk' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Users className="w-4 h-4 mr-2 inline" />
            Bulk Invite
          </button>
          <button
            onClick={() => setMode('csv')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              mode === 'csv' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Upload className="w-4 h-4 mr-2 inline" />
            CSV Upload
          </button>
        </div>

        {/* Invitation Message */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Invitation Message (Optional)
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Add a personal message to the invitation email..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
        </div>

        {/* Single Invite Form */}
        {mode === 'single' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                type="email"
                label="Email Address"
                value={singleEmail}
                onChange={(e) => setSingleEmail(e.target.value)}
                placeholder="user@example.com"
              />
              <Select
                label="Role"
                value={singleRole}
                onChange={(e) => setSingleRole(e.target.value)}
                options={roleOptions}
              />
            </div>
            <Button 
              onClick={handleSingleInvite}
              disabled={!singleEmail || !isValidEmail(singleEmail) || isProcessing}
            >
              Send Invitation
            </Button>
          </div>
        )}

        {/* Bulk Invite Form */}
        {mode === 'bulk' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Addresses
              </label>
              <textarea
                value={bulkEmails}
                onChange={(e) => setBulkEmails(e.target.value)}
                placeholder="Enter email addresses separated by commas or new lines&#10;user1@example.com&#10;user2@example.com&#10;user3@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={6}
              />
              <p className="text-sm text-gray-500 mt-1">
                Enter multiple email addresses separated by commas or new lines
              </p>
            </div>
            <Select
              label="Role for All Invitees"
              value={bulkRole}
              onChange={(e) => setBulkRole(e.target.value)}
              options={roleOptions}
            />
            <Button 
              onClick={handleBulkInvites}
              disabled={!bulkEmails || isProcessing}
            >
              Send {bulkEmails.split(/[,\n]/).filter(e => e.trim()).length} Invitations
            </Button>
          </div>
        )}

        {/* CSV Upload Form */}
        {mode === 'csv' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CSV File
              </label>
              <input
                type="file"
                accept=".csv"
                onChange={handleCsvUpload}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <p className="text-sm text-gray-500 mt-1">
                CSV should contain columns: email (required), role (optional)
              </p>
            </div>

            {csvData.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  Preview ({csvData.length} members)
                </h4>
                <div className="max-h-40 overflow-y-auto border rounded-md">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left">Email</th>
                        <th className="px-3 py-2 text-left">Role</th>
                      </tr>
                    </thead>
                    <tbody>
                      {csvData.map((item, index) => (
                        <tr key={index} className="border-t">
                          <td className="px-3 py-2">{item.email}</td>
                          <td className="px-3 py-2">{item.role}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Button 
                  onClick={processCsvInvites}
                  disabled={isProcessing}
                  className="mt-3"
                >
                  Send {csvData.length} Invitations
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Processing Results */}
        {invites.length > 0 && (
          <Card>
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              Invitation Status
            </h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {invites.map((invite, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(invite.status)}
                    <span className="text-sm font-medium">{invite.email}</span>
                    <span className="text-xs text-gray-500 px-2 py-1 bg-gray-200 rounded">
                      {invite.role}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-medium ${
                      invite.status === 'sent' ? 'text-green-600' :
                      invite.status === 'error' ? 'text-red-600' :
                      invite.status === 'sending' ? 'text-blue-600' :
                      'text-gray-500'
                    }`}>
                      {invite.status === 'sent' ? 'Sent' :
                       invite.status === 'error' ? 'Failed' :
                       invite.status === 'sending' ? 'Sending...' :
                       'Pending'}
                    </span>
                    {invite.error && (
                      <p className="text-xs text-red-600 mt-1">{invite.error}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {!isProcessing && invites.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded-md">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-600" />
                  <p className="text-sm text-blue-800">
                    <strong>{invites.filter(i => i.status === 'sent').length}</strong> invitations sent successfully.
                    {invites.filter(i => i.status === 'error').length > 0 && (
                      <span> <strong>{invites.filter(i => i.status === 'error').length}</strong> failed.</span>
                    )}
                  </p>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// components/Team/MembersList.tsx
import React, { useState, useEffect } from 'react';
import { User, Shield, Edit, Trash2, MoreHorizontal, Crown, UserCheck } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { Badge } from '../ui/Badge';

interface TeamMember {
  id: string;
  userId: string;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  joinedAt: string;
  lastActive?: string;
  avatar?: string;
  status: 'active' | 'invited' | 'inactive';
}

interface MembersListProps {
  teamId: string;
  currentUser: { id: string; role: string };
  onMemberRoleChange: (memberId: string, newRole: string) => void;
  onMemberRemove: (memberId: string) => void;
}

export const MembersList: React.FC<MembersListProps> = ({
  teamId,
  currentUser,
  onMemberRoleChange,
  onMemberRemove
}) => {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ type: 'role' | 'remove'; memberId: string; data?: any } | null>(null);

  useEffect(() => {
    fetchMembers();
  }, [teamId]);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/team/members?teamId=${teamId}`, {
        headers: { 'x-user-id': currentUser.id }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMembers(data.members || []);
      } else {
        console.error('Failed to fetch members');
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    const member = members.find(m => m.id === memberId);
    if (!member) return;

    // Prevent role changes that aren't allowed
    if (member.role === 'owner' && currentUser.role !== 'owner') {
      alert('Only owners can change owner roles');
      return;
    }

    if (currentUser.role === 'admin' && ['owner', 'admin'].includes(newRole)) {
      alert('Admins cannot assign owner or admin roles');
      return;
    }

    setConfirmAction({ type: 'role', memberId, data: { newRole, oldRole: member.role } });
  };

  const confirmRoleChange = async () => {
    if (!confirmAction || confirmAction.type !== 'role') return;

    try {
      const response = await fetch(`/api/team/member/${confirmAction.memberId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id
        },
        body: JSON.stringify({ role: confirmAction.data.newRole })
      });

      if (response.ok) {
        onMemberRoleChange(confirmAction.memberId, confirmAction.data.newRole);
        await fetchMembers();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update role');
      }
    } catch (error) {
      alert('Failed to update role');
    }

    setConfirmAction(null);
  };

  const handleRemoveMember = (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    if (!member) return;

    if (member.role === 'owner') {
      alert('Cannot remove team owner');
      return;
    }

    setConfirmAction({ type: 'remove', memberId });
  };

  const confirmRemoveMember = async () => {
    if (!confirmAction || confirmAction.type !== 'remove') return;

    try {
      const response = await fetch(`/api/team/member/${confirmAction.memberId}`, {
        method: 'DELETE',
        headers: { 'x-user-id': currentUser.id }
      });

      if (response.ok) {
        onMemberRemove(confirmAction.memberId);
        await fetchMembers();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to remove member');
      }
    } catch (error) {
      alert('Failed to remove member');
    }

    setConfirmAction(null);
  };

  const canManageMember = (member: TeamMember) => {
    if (currentUser.id === member.userId) return false; // Can't manage self
    if (member.role === 'owner') return currentUser.role === 'owner';
    if (member.role === 'admin') return ['owner'].includes(currentUser.role);
    return ['owner', 'admin'].includes(currentUser.role);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="w-4 h-4 text-yellow-600" />;
      case 'admin':
        return <Shield className="w-4 h-4 text-blue-600" />;
      case 'editor':
        return <Edit className="w-4 h-4 text-green-600" />;
      case 'viewer':
        return <UserCheck className="w-4 h-4 text-gray-600" />;
      default:
        return <User className="w-4 h-4 text-gray-400" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'warning';
      case 'admin':
        return 'info';
      case 'editor':
        return 'success';
      case 'viewer':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'invited':
        return 'warning';
      case 'inactive':
        return 'default';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const roleOptions = [
    { value: 'viewer', label: 'Viewer' },
    { value: 'editor', label: 'Editor' },
    { value: 'admin', label: 'Admin' },
    ...(currentUser.role === 'owner' ? [{ value: 'owner', label: 'Owner' }] : [])
  ];

  if (loading) {
    return (
      <Card>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4 mt-2"></div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Team Members ({members.length})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Member</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Role</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Joined</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id} className="border-b border-gray-100">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          {member.avatar ? (
                            <img src={member.avatar} alt={member.name} className="w-full h-full rounded-full" />
                          ) : (
                            <span className="text-sm font-medium text-gray-600">
                              {member.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{member.name}</p>
                          <p className="text-sm text-gray-500">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        {getRoleIcon(member.role)}
                        <Badge variant={getRoleColor(member.role) as any}>
                          {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                        </Badge>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant={getStatusColor(member.status) as any}>
                        {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                      </Badge>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600">
                      {formatDate(member.joinedAt)}
                    </td>
                    <td className="py-4 px-4">
                      {canManageMember(member) ? (
                        <div className="flex items-center gap-2">
                          <Select
                            value={member.role}
                            onChange={(e) => handleRoleChange(member.id, e.target.value)}
                            options={roleOptions}
                            className="text-sm"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveMember(member.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {members.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <User className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No team members found</p>
            </div>
          )}
        </div>
      </Card>

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {confirmAction.type === 'role' ? 'Confirm Role Change' : 'Confirm Remove Member'}
            </h3>
            <p className="text-gray-700 mb-6">
              {confirmAction.type === 'role' 
                ? `Change ${members.find(m => m.id === confirmAction.memberId)?.name}'s role from ${confirmAction.data?.oldRole} to ${confirmAction.data?.newRole}?`
                : `Remove ${members.find(m => m.id === confirmAction.memberId)?.name} from the team?`
              }
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setConfirmAction(null)}>
                Cancel
              </Button>
              <Button 
                variant={confirmAction.type === 'remove' ? 'danger' : 'primary'}
                onClick={confirmAction.type === 'role' ? confirmRoleChange : confirmRemoveMember}
              >
                {confirmAction.type === 'role' ? 'Change Role' : 'Remove Member'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// components/Team/TeamStats.tsx
import React from 'react';
import { Users, Calendar, Bell, TrendingUp, Activity, Clock } from 'lucide-react';
import { Card } from '../ui/Card';

interface TeamStatsProps {
  teamId: string;
  stats: {
    totalMembers: number;
    activeMembers: number;
    totalEvents: number;
    completedEvents: number;
    upcomingDeadlines: number;
    complianceRate: number;
    avgResponseTime: number;
    recentActivity: Array<{
      id: string;
      action: string;
      actor: string;
      timestamp: string;
      metadata?: any;
    }>;
  };
}

export const TeamStats: React.FC<TeamStatsProps> = ({ stats }) => {
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  const formatPercentage = (num: number) => {
    return `${Math.round(num)}%`;
  };

  const getActivityIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create_event':
        return <Calendar className="w-4 h-4 text-green-600" />;
      case 'update_event':
        return <Calendar className="w-4 h-4 text-blue-600" />;
      case 'invite_member':
        return <Users className="w-4 h-4 text-blue-600" />;
      case 'assign_role':
        return <Users className="w-4 h-4 text-orange-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatActionText = (action: string) => {
    return action.toLowerCase().replace(/_/g, ' ');
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(stats.totalMembers)}</p>
              <p className="text-sm text-gray-600">Total Members</p>
              <p className="text-xs text-green-600">
                {stats.activeMembers} active
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(stats.totalEvents)}</p>
              <p className="text-sm text-gray-600">Total Events</p>
              <p className="text-xs text-green-600">
                {stats.completedEvents} completed
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Bell className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(stats.upcomingDeadlines)}</p>
              <p className="text-sm text-gray-600">Upcoming Deadlines</p>
              <p className="text-xs text-orange-600">Next 30 days</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{formatPercentage(stats.complianceRate)}</p>
              <p className="text-sm text-gray-600">Compliance Rate</p>
              <p className="text-xs text-purple-600">Last 30 days</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          <span className="text-sm text-gray-500">Last 7 days</span>
        </div>
        
        <div className="space-y-4">
          {stats.recentActivity.length > 0 ? (
            stats.recentActivity.slice(0, 10).map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  {getActivityIcon(activity.action)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">{activity.actor}</span>{' '}
                    {formatActionText(activity.action)}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <p className="text-xs text-gray-500">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No recent activity</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};