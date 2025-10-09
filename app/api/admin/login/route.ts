import { NextRequest, NextResponse } from 'next/server';
import { dbPool } from '@/lib/db-pool-prisma';

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
    
    // Debug: Log the attempt
    console.log(`Admin login attempt for: ${email}`);
    
    // Authenticate admin
    const adminService = dbPool.getAdminService();
    const result = await adminService.authenticateAdmin(email, password);
    
    console.log(`Admin login result:`, result);

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
