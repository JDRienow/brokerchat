import { type NextRequest, NextResponse } from 'next/server';
import { acceptTeamInvitation } from '@/lib/db/queries';
import { hash } from 'bcrypt-ts';

export async function POST(request: NextRequest) {
  try {
    const { token, password, firstName, lastName } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        {
          error: 'Token and password are required',
        },
        { status: 400 },
      );
    }

    // Hash the password
    const passwordHash = await hash(password, 12);

    // Accept the invitation and create the account
    const newMember = await acceptTeamInvitation(token, passwordHash);

    // Update the member's name if provided
    if (firstName || lastName) {
      const { updateBroker } = await import('@/lib/db/queries');
      await updateBroker(newMember.id, {
        first_name: firstName || '',
        last_name: lastName || '',
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Team invitation accepted successfully',
      user: {
        id: newMember.id,
        email: newMember.email,
      },
    });
  } catch (error: any) {
    console.error('Team invitation acceptance error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to accept invitation',
      },
      { status: 400 },
    );
  }
}
