import { NextRequest, NextResponse } from 'next/server';
import AdminService from '@/lib/admin-service-fallback';

export async function POST(request: NextRequest) {
  try {
    const adminService = new AdminService();
    
    // Get all admins
    const admins = await adminService.getAllAdmins();
    
    if (admins.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No admin records found to update',
        updated: 0
      });
    }

    // Fix all admin records
    const fixResult = await adminService.fixAllAdminRecords();

    return NextResponse.json({
      success: fixResult.success,
      message: fixResult.message,
      updated: fixResult.updated
    });

  } catch (error) {
    console.error('Fix admin records error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fix admin records',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
