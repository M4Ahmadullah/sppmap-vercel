import { NextRequest, NextResponse } from 'next/server';
import { SessionManager } from '@/lib/session-manager-mongodb';
import AdminService from '@/lib/admin-service-fallback';

export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get('session-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'No session token found' },
        { status: 401 }
      );
    }

    // Verify session token
    const result = await SessionManager.verifySessionToken(token);

    if (!result.isValid) {
      return NextResponse.json(
        { error: result.error },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (!result.user!.isAdmin) {
      return NextResponse.json(
        { error: 'Only admins can delete accounts' },
        { status: 403 }
      );
    }

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Delete admin account
    const adminService = new AdminService();
    const deleteResult = await adminService.deleteAdmin(email);

    if (!deleteResult.success) {
      return NextResponse.json(
        { error: deleteResult.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully'
    });

  } catch (error) {
    console.error('Delete account error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
