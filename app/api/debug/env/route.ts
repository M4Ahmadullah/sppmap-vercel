import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Only allow this in development or for debugging
  if (process.env.NODE_ENV === 'production' && !request.headers.get('x-debug')) {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  return NextResponse.json({
    environment: process.env.NODE_ENV,
    hasMongoUri: !!process.env.MONGODB_URI,
    hasJwtSecret: !!process.env.JWT_SECRET,
    hasTeamupEmail: !!process.env.TEAMUP_EMAIL,
    hasTeamupPassword: !!process.env.TEAMUP_PASSWORD,
    jwtSecretLength: process.env.JWT_SECRET?.length || 0,
    mongoUriPrefix: process.env.MONGODB_URI?.substring(0, 20) || 'Not set',
    teamupEmail: process.env.TEAMUP_EMAIL || 'Not set',
    vercelUrl: process.env.VERCEL_URL || 'Not set',
    vercelEnv: process.env.VERCEL_ENV || 'Not set'
  });
}
