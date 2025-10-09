import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  password: string;
  role: 'admin';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class AdminService {
  // Hash password
  private async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 12);
  }

  // Verify password
  private async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  // Create new admin user
  public async createAdmin(email: string, password: string, name: string): Promise<{ success: boolean; message: string; admin?: AdminUser }> {
    try {
      // Check if admin already exists
      const existingAdmin = await prisma.adminUser.findUnique({
        where: { email: email.toLowerCase() }
      });

      if (existingAdmin) {
        return {
          success: false,
          message: 'Admin with this email already exists'
        };
      }

      // Hash password
      const hashedPassword = await this.hashPassword(password);

      // Create admin
      const admin = await prisma.adminUser.create({
        data: {
          email: email.toLowerCase(),
          password: hashedPassword,
          name,
          role: 'admin',
          isActive: true
        }
      });

      return {
        success: true,
        message: 'Admin created successfully',
        admin: admin as AdminUser
      };
    } catch (error) {
      console.error('Error creating admin:', error);
      return {
        success: false,
        message: `Failed to create admin: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  // Authenticate admin
  public async authenticateAdmin(email: string, password: string): Promise<{ success: boolean; message: string; admin?: AdminUser }> {
    try {
      const admin = await prisma.adminUser.findUnique({
        where: { 
          email: email.toLowerCase(),
          isActive: true 
        }
      });

      if (!admin) {
        return {
          success: false,
          message: 'Admin not found'
        };
      }

      const isValidPassword = await this.verifyPassword(password, admin.password);

      if (!isValidPassword) {
        return {
          success: false,
          message: 'Invalid password'
        };
      }

      return {
        success: true,
        message: 'Authentication successful',
        admin: admin as AdminUser
      };
    } catch (error) {
      console.error('Error authenticating admin:', error);
      return {
        success: false,
        message: 'Authentication failed'
      };
    }
  }

  // Get all admin users
  public async getAllAdmins(): Promise<AdminUser[]> {
    try {
      const admins = await prisma.adminUser.findMany({
        where: { isActive: true },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true
        }
      });
      
      return admins as AdminUser[];
    } catch (error) {
      console.error('Error getting all admins:', error);
      return [];
    }
  }

  // Update admin user
  public async updateAdmin(email: string, updates: Partial<Omit<AdminUser, 'id' | 'email' | 'createdAt'>>): Promise<{ success: boolean; message: string }> {
    try {
      const updateData: any = {
        ...updates,
        updatedAt: new Date()
      };

      // Hash password if it's being updated
      if (updates.password) {
        updateData.password = await this.hashPassword(updates.password);
      }

      const result = await prisma.adminUser.updateMany({
        where: { email: email.toLowerCase() },
        data: updateData
      });

      if (result.count > 0) {
        return {
          success: true,
          message: 'Admin user updated successfully'
        };
      } else {
        return {
          success: false,
          message: 'Admin user not found or no changes made'
        };
      }
    } catch (error) {
      console.error('Error updating admin user:', error);
      return {
        success: false,
        message: 'Failed to update admin user'
      };
    }
  }

  // Reset admin password
  public async resetPassword(email: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      const admin = await prisma.adminUser.findUnique({
        where: { email: email.toLowerCase() }
      });

      if (!admin) {
        return {
          success: false,
          message: 'Admin not found'
        };
      }

      // Hash new password
      const hashedPassword = await this.hashPassword(newPassword);

      // Update password
      const result = await prisma.adminUser.updateMany({
        where: { email: email.toLowerCase() },
        data: {
          password: hashedPassword,
          updatedAt: new Date()
        }
      });

      if (result.count > 0) {
        return {
          success: true,
          message: 'Password reset successfully'
        };
      } else {
        return {
          success: false,
          message: 'Failed to reset password'
        };
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      return {
        success: false,
        message: 'Failed to reset password'
      };
    }
  }

  // Deactivate admin user
  public async deactivateAdmin(email: string): Promise<{ success: boolean; message: string }> {
    return this.updateAdmin(email, { isActive: false });
  }

  // Delete admin user
  public async deleteAdmin(email: string): Promise<{ success: boolean; message: string }> {
    try {
      const result = await prisma.adminUser.deleteMany({
        where: { email: email.toLowerCase() }
      });

      if (result.count > 0) {
        return {
          success: true,
          message: 'Admin deleted successfully'
        };
      } else {
        return {
          success: false,
          message: 'Admin not found'
        };
      }
    } catch (error) {
      console.error('Error deleting admin:', error);
      return {
        success: false,
        message: 'Failed to delete admin'
      };
    }
  }

  // Fix all admin records (for compatibility)
  public async fixAllAdminRecords(): Promise<{ success: boolean; message: string; updated: number }> {
    try {
      // In Prisma, we don't need to fix records like in MongoDB
      // All records are already properly structured
      const admins = await prisma.adminUser.findMany();
      
      return {
        success: true,
        message: 'All admin records are properly structured',
        updated: admins.length
      };
    } catch (error) {
      console.error('Error fixing admin records:', error);
      return {
        success: false,
        message: 'Failed to fix admin records',
        updated: 0
      };
    }
  }
}

export default AdminService;
