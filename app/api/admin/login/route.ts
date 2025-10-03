import { NextRequest, NextResponse } from 'next/server';
import { dbPool } from '@/lib/db-pool';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Ensure database pool is initialized
    await dbPool.initialize();
    
    // Authenticate admin
    const adminService = dbPool.getAdminService();
    const result = await adminService.authenticateAdmin(email, password);

    if (result.success && result.admin) {
      return NextResponse.json({
        success: true,
        message: result.message,
        admin: result.admin
      });
    } else {
      return NextResponse.json(
        { error: result.message },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
