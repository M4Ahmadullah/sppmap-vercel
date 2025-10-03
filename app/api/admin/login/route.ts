import { NextRequest, NextResponse } from 'next/server';
import AdminService from '@/lib/admin-service';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Authenticate admin
    const adminService = new AdminService();
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
