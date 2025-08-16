import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { createTeamInvitation, getPendingInvitations } from '@/lib/db/queries';
import { sendTeamInvitationEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Create the invitation
    const invitation = await createTeamInvitation(session.user.id, email);

    // Send invitation email
    await sendTeamInvitationEmail(
      email,
      invitation.token,
      session.user.email || '',
    );

    return NextResponse.json({
      success: true,
      message: 'Invitation sent successfully',
      invitation,
    });
  } catch (error: any) {
    console.error('Team invitation error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to send invitation',
      },
      { status: 400 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get pending invitations
    const invitations = await getPendingInvitations(session.user.id);

    return NextResponse.json({ invitations });
  } catch (error: any) {
    console.error('Get invitations error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to get invitations',
      },
      { status: 500 },
    );
  }
}
