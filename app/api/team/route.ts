import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import {
  getTeamByAdminId,
  getTeamMembers,
  removeTeamMember,
  cancelTeamInvitation,
  getPendingInvitations,
} from '@/lib/db/queries';
import { supabaseAdmin } from '@/lib/db/queries';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    console.log('API /api/team session.user:', session?.user);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check if user has team subscription or is a team admin
    let team: any = null;
    let members: any[] = [];
    let invitations: any[] = [];
    let isTeamAdmin = false;

    try {
      team = await getTeamByAdminId(session.user.id);
      if (team) {
        isTeamAdmin = true;
        // Get team members
        members = await getTeamMembers(team.id);
        // Get pending invitations
        invitations = await getPendingInvitations(session.user.id);
      } else if ((session.user as any).team_id) {
        console.log(
          'API /api/team: user is not admin, using team_id',
          (session.user as any).team_id,
        );
        // If not admin, but user is on a team, get their team and members
        const { data: userTeam, error: teamError } = await supabaseAdmin
          .from('teams')
          .select('*')
          .eq('id', (session.user as any).team_id)
          .maybeSingle();
        if (teamError) throw teamError;
        team = userTeam;
        if (team) {
          members = await getTeamMembers(team.id);
          // Get invitations for the admin of this team
          invitations = await getPendingInvitations(team.admin_broker_id);
        }
      }
    } catch (error: any) {
      // If no team found, that's okay - user can create one by inviting members
      if (error.code === 'PGRST116') {
        // No team exists yet, return empty data
        if (session.user.subscription_tier !== 'team') {
          return NextResponse.json(
            { error: 'Team subscription required' },
            { status: 403 },
          );
        }
        return NextResponse.json({
          team: null,
          members: [],
          invitations: [],
        });
      }
      throw error;
    }

    // If not team admin and not on team tier, block access
    if (!isTeamAdmin && session.user.subscription_tier !== 'team') {
      return NextResponse.json(
        { error: 'Team subscription required' },
        { status: 403 },
      );
    }

    return NextResponse.json({
      team,
      members,
      invitations,
    });
  } catch (error: any) {
    console.error('Get team error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to get team info',
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');
    const invitationId = searchParams.get('invitationId');

    if (memberId) {
      // Remove team member
      await removeTeamMember(session.user.id, memberId);
      return NextResponse.json({
        success: true,
        message: 'Team member removed successfully',
      });
    }

    if (invitationId) {
      // Cancel invitation
      await cancelTeamInvitation(invitationId, session.user.id);
      return NextResponse.json({
        success: true,
        message: 'Invitation cancelled successfully',
      });
    }

    return NextResponse.json(
      {
        error: 'Either memberId or invitationId is required',
      },
      { status: 400 },
    );
  } catch (error: any) {
    console.error('Team management error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to perform action',
      },
      { status: 400 },
    );
  }
}
