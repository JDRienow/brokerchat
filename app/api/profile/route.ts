import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { updateBroker, trackUserAction } from '@/lib/db/queries';
import { z } from 'zod';

const updateProfileSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(50),
  last_name: z.string().min(1, 'Last name is required').max(50),
  company_name: z.string().min(1, 'Company name is required').max(100),
  phone: z.string().optional(),
});

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.type !== 'broker') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateProfileSchema.parse(body);

    // Update broker profile
    const updatedBroker = await updateBroker(session.user.id, validatedData);

    // Track profile update analytics
    try {
      await trackUserAction(session.user.id, 'profile_update', {
        updated_fields: Object.keys(validatedData),
        timestamp: new Date().toISOString(),
      });
    } catch (analyticsError) {
      console.error(
        'Failed to track profile update analytics:',
        analyticsError,
      );
    }

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: updatedBroker,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 },
      );
    }

    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 },
    );
  }
}
