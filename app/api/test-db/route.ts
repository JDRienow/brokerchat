import { NextResponse } from 'next/server';
import { getBrokerByEmail, createBroker } from '@/lib/db/queries';
import { hash } from 'bcrypt-ts';

export async function GET() {
  try {
    // Test basic database connection
    const testEmail = 'test@example.com';

    // Try to get a broker (should return null for test email)
    const existingBroker = await getBrokerByEmail(testEmail);

    if (existingBroker) {
      return NextResponse.json({
        success: false,
        error: 'Test email already exists in database',
      });
    }

    // Try to create a test broker
    const hashedPassword = await hash('testpassword123', 10);

    const newBroker = await createBroker({
      email: testEmail,
      password_hash: hashedPassword,
      first_name: 'Test',
      last_name: 'User',
      company_name: 'Test Company',
    });

    // Clean up - delete the test broker
    // Note: You might need to add a delete function to your queries

    return NextResponse.json({
      success: true,
      message: 'Database connection and broker creation working',
      brokerId: newBroker.id,
    });
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error,
      },
      { status: 500 },
    );
  }
}
