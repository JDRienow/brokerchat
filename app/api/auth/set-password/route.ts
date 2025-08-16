import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { hash } from 'bcrypt-ts';
import {
  getBrokerByResetToken,
  updateBrokerPassword,
  clearPasswordResetToken,
} from '@/lib/db/queries';

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(6),
});

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();
    const parsed = schema.safeParse({ token, password });
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    const broker = await getBrokerByResetToken(token);
    if (!broker) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 400 },
      );
    }
    const hashedPassword = await hash(password, 10);
    await updateBrokerPassword(broker.id, hashedPassword);
    await clearPasswordResetToken(broker.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error setting password:', error);
    return NextResponse.json(
      { error: 'Failed to set password' },
      { status: 500 },
    );
  }
}
