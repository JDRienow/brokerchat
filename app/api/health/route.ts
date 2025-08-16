import { NextResponse } from 'next/server';

export async function GET() {
  const checks: Record<string, any> = {};

  // Environment checks
  checks.openai = Boolean(process.env.OPENAI_API_KEY);
  checks.supabaseUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  checks.supabaseAnon = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  checks.supabaseService = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  checks.redisUrl = Boolean(process.env.REDIS_URL);
  checks.vercelKv =
    Boolean(process.env.KV_REST_API_URL) &&
    Boolean(process.env.KV_REST_API_TOKEN);
  checks.stripeSecret = Boolean(process.env.STRIPE_SECRET_KEY);

  const allGood = Object.values(checks).some(Boolean);

  return NextResponse.json(
    { ok: allGood, checks },
    { status: allGood ? 200 : 500 },
  );
}
