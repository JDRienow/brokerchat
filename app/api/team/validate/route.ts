import { type NextRequest, NextResponse } from 'next/server';
import { getTeamInvitationByToken } from '@/lib/db/queries';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        {
          error: 'Token is required',
        },
        { status: 400 },
      );
    }

    // Get the invitation
    const invitation = await getTeamInvitationByToken(token);

    if (!invitation) {
      return NextResponse.json(
        {
          error: 'Invalid or expired invitation',
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      invitation: {
        id: invitation.id,
        invited_email: invitation.invited_email,
        expires_at: invitation.expires_at,
        teams: invitation.teams,
      },
    });
  } catch (error: any) {
    console.error('Team invitation validation error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to validate invitation',
      },
      { status: 400 },
    );
  }
}
