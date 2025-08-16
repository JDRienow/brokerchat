'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/toast';
import {
  ArrowLeftIcon,
  UserIcon,
  TrashIcon,
  CrossIcon,
} from '@/components/icons';

interface TeamMember {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  company_name: string;
  is_team_admin: boolean;
  created_at: string;
}

interface TeamInvitation {
  id: string;
  invited_email: string;
  created_at: string;
  expires_at: string;
}

export function TeamManagement() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [invitingEmails, setInvitingEmails] = useState(['', '', '', '']); // 4 empty slots
  const [invitingStates, setInvitingStates] = useState([
    false,
    false,
    false,
    false,
  ]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<
    TeamInvitation[]
  >([]);
  const [teamInfo, setTeamInfo] = useState<any>(null);

  useEffect(() => {
    fetchTeamData();
  }, []);

  const fetchTeamData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/team');
      if (response.ok) {
        const data = await response.json();
        setTeamInfo(data.team);
        setTeamMembers(data.members);
        setPendingInvitations(data.invitations);
      } else {
        const error = await response.json();
        toast({
          type: 'error',
          description: error.error || 'Failed to load team data',
        });
      }
    } catch (error) {
      console.error('Error fetching team data:', error);
      toast({
        type: 'error',
        description: 'Failed to load team data',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInviteMember = async (index: number) => {
    const email = invitingEmails[index].trim();

    if (!email) {
      toast({
        type: 'error',
        description: 'Please enter an email address',
      });
      return;
    }

    // Update inviting state for this specific slot
    const newInvitingStates = [...invitingStates];
    newInvitingStates[index] = true;
    setInvitingStates(newInvitingStates);

    try {
      const response = await fetch('/api/team/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        toast({
          type: 'success',
          description: 'Invitation sent successfully!',
        });
        // Clear this email slot
        const newEmails = [...invitingEmails];
        newEmails[index] = '';
        setInvitingEmails(newEmails);
        fetchTeamData(); // Refresh to show new invitation
      } else {
        const error = await response.json();
        toast({
          type: 'error',
          description: error.error || 'Failed to send invitation',
        });
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast({
        type: 'error',
        description: 'Failed to send invitation',
      });
    } finally {
      // Reset inviting state for this slot
      const newInvitingStates = [...invitingStates];
      newInvitingStates[index] = false;
      setInvitingStates(newInvitingStates);
    }
  };

  const handleEmailChange = (index: number, value: string) => {
    const newEmails = [...invitingEmails];
    newEmails[index] = value;
    setInvitingEmails(newEmails);
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) {
      return;
    }

    try {
      const response = await fetch(`/api/team?memberId=${memberId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          type: 'success',
          description: 'Team member removed successfully',
        });
        fetchTeamData();
      } else {
        const error = await response.json();
        toast({
          type: 'error',
          description: error.error || 'Failed to remove team member',
        });
      }
    } catch (error) {
      console.error('Error removing team member:', error);
      toast({
        type: 'error',
        description: 'Failed to remove team member',
      });
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    if (!confirm('Are you sure you want to cancel this invitation?')) {
      return;
    }

    try {
      const response = await fetch(`/api/team?invitationId=${invitationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          type: 'success',
          description: 'Invitation cancelled successfully',
        });
        fetchTeamData();
      } else {
        const error = await response.json();
        toast({
          type: 'error',
          description: error.error || 'Failed to cancel invitation',
        });
      }
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      toast({
        type: 'error',
        description: 'Failed to cancel invitation',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading team data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      {/* Back to Profile Button */}
      <div className="mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/profile')}
          className="flex items-center gap-2"
        >
          <ArrowLeftIcon size={16} />
          Back to Profile
        </Button>
      </div>

      {/* Team Management Header */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold">Team Management</h1>
        <p className="text-muted-foreground">
          Invite team members and manage collaboration
        </p>
      </div>

      {/* Team Info */}
      <Card>
        <CardHeader>
          <CardTitle>Team Information</CardTitle>
          <CardDescription>Your team details and member count</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">
                Team Name
              </Label>
              <p className="text-sm font-semibold">
                {teamInfo?.name || 'My Team'}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">
                Current Members
              </Label>
              <p className="text-sm font-semibold">{teamMembers.length} / 5</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">
                Pending Invitations
              </Label>
              <p className="text-sm font-semibold">
                {pendingInvitations.length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invite Team Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon />
            Invite Team Members ({teamMembers.length}/4)
          </CardTitle>
          <CardDescription>
            Send invitations to collaborate on documents and analytics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {invitingEmails.map((email, index) => (
              <div key={`invite-slot-${index}-${email}`} className="flex gap-2">
                <div className="flex-1">
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => handleEmailChange(index, e.target.value)}
                    placeholder={`Enter email address for team member ${index + 1}`}
                    disabled={invitingStates[index]}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={() => handleInviteMember(index)}
                    disabled={
                      invitingStates[index] ||
                      !email.trim() ||
                      teamMembers.length >= 4
                    }
                    variant={email.trim() ? 'default' : 'outline'}
                  >
                    {invitingStates[index] ? 'Sending...' : 'Invite'}
                  </Button>
                </div>
              </div>
            ))}
            {teamMembers.length >= 4 && (
              <p className="text-sm text-red-600">
                Team is at maximum capacity (4 members total)
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Team Members */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            Current team members and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {teamMembers.length === 0 ? (
            <p className="text-muted-foreground">No team members yet.</p>
          ) : (
            <div className="space-y-4">
              {teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">
                        {member.first_name && member.last_name
                          ? `${member.first_name} ${member.last_name}`
                          : member.email}
                      </span>
                      {member.is_team_admin ? (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          Admin
                        </span>
                      ) : (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {member.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Joined {new Date(member.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {!member.is_team_admin && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveMember(member.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <TrashIcon size={16} />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Invitations</CardTitle>
            <CardDescription>
              Invitations that haven't been accepted yet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingInvitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">
                        {invitation.invited_email}
                      </span>
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                        Invited
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Sent{' '}
                      {new Date(invitation.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Expires{' '}
                      {new Date(invitation.expires_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCancelInvitation(invitation.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <CrossIcon size={16} />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Team Features Info */}
      <Card>
        <CardHeader>
          <CardTitle>Team Features</CardTitle>
          <CardDescription>What your team members can do</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold">Shared Access</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• View all team documents</li>
                <li>• Access shared analytics</li>
                <li>• Collaborate on presentations</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Team Management</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Invite up to 4 team members</li>
                <li>• Remove team members</li>
                <li>• Manage invitations</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
