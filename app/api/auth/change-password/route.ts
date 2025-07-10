import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { compare, hash } from 'bcrypt-ts';
import { auth } from '@/app/(auth)/auth';
import { getBrokerByEmail, updateBrokerPassword } from '@/lib/db/queries';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.type !== 'broker') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { message: 'Current password and new password are required' },
        { status: 400 },
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { message: 'New password must be at least 6 characters long' },
        { status: 400 },
      );
    }

    // Get the broker from database
    if (!session.user.email) {
      return NextResponse.json(
        { message: 'User email not found in session' },
        { status: 400 },
      );
    }

    const broker = await getBrokerByEmail(session.user.email);

    if (!broker || !broker.password_hash) {
      return NextResponse.json(
        { message: 'User not found or invalid account' },
        { status: 404 },
      );
    }

    // Verify current password
    const passwordMatch = await compare(currentPassword, broker.password_hash);

    if (!passwordMatch) {
      return NextResponse.json(
        { message: 'Current password is incorrect' },
        { status: 400 },
      );
    }

    // Hash new password
    const hashedNewPassword = await hash(newPassword, 10);

    // Update password in database
    await updateBrokerPassword(broker.id, hashedNewPassword);

    return NextResponse.json(
      { message: 'Password updated successfully' },
      { status: 200 },
    );
  } catch (error) {
    console.error('Password change error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 },
    );
  }
}
