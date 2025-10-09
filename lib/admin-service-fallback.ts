import MongoDBManager, { AdminUser } from './mongodb-manager';
import { memoryDb, MemoryAdmin } from './memory-db';
import { dbPool } from './db-pool';
import bcrypt from 'bcryptjs';

export class AdminService {
  private dbManager: MongoDBManager;
  private useMemoryDb: boolean = false;
  private static connectionChecked: boolean = false;

  constructor() {
    this.dbManager = MongoDBManager.getInstance();
  }

  // Test MongoDB connection and fallback to memory DB if needed
  private async ensureConnection(): Promise<void> {
    // Only check connection once globally
    if (AdminService.connectionChecked) {
      return;
    }
    
    try {
      await dbPool.initialize();
      this.useMemoryDb = false;
      AdminService.connectionChecked = true;
    } catch (error) {
      console.warn('MongoDB connection failed, using memory database:', error instanceof Error ? error.message : String(error));
      this.useMemoryDb = true;
      AdminService.connectionChecked = true;
    }
  }

  // Hash password
  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  // Verify password
  private async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  // Create new admin user
  public async createAdmin(email: string, password: string, name: string): Promise<{ success: boolean; message: string; admin?: AdminUser }> {
    await this.ensureConnection();

    try {
      if (this.useMemoryDb) {
        // Use memory database
        const existingAdmin = await memoryDb.findAdminByEmail(email.toLowerCase());
        
        if (existingAdmin) {
          return {
            success: false,
            message: 'Admin with this email already exists'
          };
        }

        const passwordHash = await this.hashPassword(password);
        const memoryAdmin = await memoryDb.createAdmin({
          email: email.toLowerCase(),
          name,
          passwordHash
        });

        // Convert to AdminUser format
        const admin: AdminUser = {
          _id: memoryAdmin._id,
          email: memoryAdmin.email,
          name: memoryAdmin.name,
          password: memoryAdmin.passwordHash,
          role: 'admin' as const,
          isActive: true,
          createdAt: memoryAdmin.createdAt,
          updatedAt: memoryAdmin.createdAt
        };

        return {
          success: true,
          message: 'Admin created successfully (using memory database)',
          admin
        };
      } else {
        // Use MongoDB
        const collection = this.dbManager.getAdminCollection();
        
        // Check if admin already exists
        const existingAdmin = await collection.findOne({ email: email.toLowerCase() });
        
        if (existingAdmin) {
          return {
            success: false,
            message: 'Admin with this email already exists'
          };
        }

        const passwordHash = await this.hashPassword(password);
        
        const adminData = {
          email: email.toLowerCase(),
          name,
          password: passwordHash,
          role: 'admin' as const,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const result = await collection.insertOne(adminData);
        
        if (result.insertedId) {
        const admin: AdminUser = {
          _id: result.insertedId.toString(),
          email: adminData.email,
          name: adminData.name,
          password: adminData.password,
          role: 'admin' as const,
          isActive: true,
          createdAt: adminData.createdAt,
          updatedAt: adminData.updatedAt
        };

          return {
            success: true,
            message: 'Admin created successfully',
            admin
          };
        } else {
          return {
            success: false,
            message: 'Failed to create admin user'
          };
        }
      }
    } catch (error) {
      console.error('Admin creation error:', error instanceof Error ? error.message : String(error));
      return {
        success: false,
        message: `Failed to create admin: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  // Authenticate admin user
  public async authenticateAdmin(email: string, password: string): Promise<{ success: boolean; message: string; admin?: AdminUser }> {
    await this.ensureConnection();

    try {
      console.log(`Authenticating admin: ${email}`);
      console.log(`Using memory DB: ${this.useMemoryDb}`);
      
      if (this.useMemoryDb) {
        // Use memory database
        const admin = await memoryDb.findAdminByEmail(email.toLowerCase());
        console.log(`Memory admin found:`, admin ? 'Yes' : 'No');
        
        if (!admin) {
          console.log(`Admin not found in memory DB for email: ${email}`);
          return {
            success: false,
            message: 'Admin not found'
          };
        }

        const isValidPassword = await this.verifyPassword(password, admin.passwordHash);
        console.log(`Password valid: ${isValidPassword}`);
        
        if (!isValidPassword) {
          console.log(`Invalid password for admin: ${email}`);
          return {
            success: false,
            message: 'Invalid password'
          };
        }

        // Convert to AdminUser format
        const adminUser: AdminUser = {
          _id: admin._id,
          email: admin.email,
          name: admin.name,
          password: admin.passwordHash,
          role: 'admin' as const,
          isActive: true,
          createdAt: admin.createdAt,
          updatedAt: new Date()
        };

        return {
          success: true,
          message: 'Authentication successful (using memory database)',
          admin: adminUser
        };
      } else {
        // Use MongoDB
        const collection = this.dbManager.getAdminCollection();
        const admin = await collection.findOne({ 
          email: email.toLowerCase(),
          isActive: true 
        });
        
        console.log(`MongoDB admin found:`, admin ? 'Yes' : 'No');
        if (admin) {
          console.log(`Admin email: ${admin.email}, isActive: ${admin.isActive}`);
        }
        
        if (!admin) {
          console.log(`Admin not found in MongoDB for email: ${email}`);
          return {
            success: false,
            message: 'Admin not found'
          };
        }

        const isValidPassword = await this.verifyPassword(password, admin.password);
        console.log(`MongoDB password valid: ${isValidPassword}`);
        
        if (!isValidPassword) {
          console.log(`Invalid password for MongoDB admin: ${email}`);
          return {
            success: false,
            message: 'Invalid password'
          };
        }

        const adminUser: AdminUser = {
          _id: admin._id.toString(),
          email: admin.email,
          name: admin.name,
          password: admin.password,
          role: 'admin' as const,
          isActive: true,
          createdAt: admin.createdAt,
          updatedAt: new Date()
        };

        return {
          success: true,
          message: 'Authentication successful',
          admin: adminUser
        };
      }
    } catch (error) {
      console.error('Admin authentication error:', error instanceof Error ? error.message : String(error));
      return {
        success: false,
        message: `Authentication failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  // Get all admins
  public async getAllAdmins(): Promise<AdminUser[]> {
    await this.ensureConnection();

    try {
      if (this.useMemoryDb) {
        const memoryAdmins = await memoryDb.getAllAdmins();
        return memoryAdmins.map(admin => ({
          _id: admin._id,
          email: admin.email,
          name: admin.name,
          password: admin.passwordHash,
          role: 'admin' as const,
          isActive: true,
          createdAt: admin.createdAt,
          updatedAt: new Date()
        }));
      } else {
        const collection = this.dbManager.getAdminCollection();
        const admins = await collection.find({}).toArray();
        
        return admins.map(admin => ({
          _id: admin._id.toString(),
          email: admin.email,
          name: admin.name,
          password: admin.password,
          role: 'admin' as const,
          isActive: true,
          createdAt: admin.createdAt,
          updatedAt: new Date()
        }));
      }
    } catch (error) {
      console.error('Get admins error:', error instanceof Error ? error.message : String(error));
      return [];
    }
  }

  // Update admin user
  public async updateAdmin(email: string, updates: Partial<Omit<AdminUser, '_id' | 'email' | 'createdAt'>>): Promise<{ success: boolean; message: string }> {
    try {
      await this.ensureConnection();
      
      const collection = this.dbManager.getAdminCollection();
      
      const updateData = {
        ...updates,
        updatedAt: new Date()
      };

      // Hash password if it's being updated
      if (updates.password) {
        updateData.password = await this.hashPassword(updates.password);
      }

      const result = await collection.updateOne(
        { email: email.toLowerCase() },
        { $set: updateData }
      );

      if (result.modifiedCount > 0) {
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

  // Update existing admin records to include missing fields
  public async updateAdminRecord(email: string): Promise<{ success: boolean; message: string }> {
    try {
      await this.ensureConnection();
      
      const collection = this.dbManager.getAdminCollection();
      
      // Find the admin record
      const admin = await collection.findOne({ email: email.toLowerCase() });
      
      if (!admin) {
        return {
          success: false,
          message: 'Admin not found'
        };
      }

      // Update with missing fields
      const updateData = {
        $set: {
          role: 'admin' as const,
          isActive: true,
          updatedAt: new Date()
        }
      };

      const result = await collection.updateOne(
        { email: email.toLowerCase() },
        updateData
      );

      if (result.modifiedCount > 0) {
        return {
          success: true,
          message: 'Admin record updated successfully'
        };
      } else {
        return {
          success: false,
          message: 'No changes made to admin record'
        };
      }

    } catch (error) {
      console.error('Error updating admin record:', error);
      return {
        success: false,
        message: `Failed to update admin record: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  // Fix all admin records
  public async fixAllAdminRecords(): Promise<{ success: boolean; message: string; updated: number }> {
    try {
      await this.ensureConnection();
      
      const collection = this.dbManager.getAdminCollection();
      
      // Update all admin records to include missing fields
      const result = await collection.updateMany(
        { 
          email: { $exists: true },
          $or: [
            { role: { $exists: false } },
            { isActive: { $exists: false } }
          ]
        },
        {
          $set: {
            role: 'admin' as const,
            isActive: true,
            updatedAt: new Date()
          }
        }
      );

      return {
        success: true,
        message: `Updated ${result.modifiedCount} admin records`,
        updated: result.modifiedCount
      };

    } catch (error) {
      console.error('Error fixing admin records:', error);
      return {
        success: false,
        message: `Failed to fix admin records: ${error instanceof Error ? error.message : String(error)}`,
        updated: 0
      };
    }
  }

  // Reset admin password
  public async resetPassword(email: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      await this.ensureConnection();
      
      
      if (this.useMemoryDb) {
        // Update memory database
        const admin = await memoryDb.findAdminByEmail(email.toLowerCase());
        
        if (!admin) {
          console.log(`Admin not found in memory DB for email: ${email}`);
          return {
            success: false,
            message: 'Admin not found'
          };
        }

        // Hash new password
        const hashedPassword = await this.hashPassword(newPassword);
        
        // Update password in memory
        admin.passwordHash = hashedPassword;
        
        return {
          success: true,
          message: 'Password reset successfully (memory database)'
        };
      } else {
        // Update MongoDB
        const collection = this.dbManager.getAdminCollection();
        
        // Check if admin exists
        const admin = await collection.findOne({ email: email.toLowerCase() });
        
        if (!admin) {
          console.log(`Admin not found for email: ${email}`);
          return {
            success: false,
            message: 'Admin not found'
          };
        }

        console.log(`Found admin: ${admin.email}, current password field: ${admin.password ? 'exists' : 'missing'}`);

        // Hash new password
        const hashedPassword = await this.hashPassword(newPassword);
        console.log(`Hashed password: ${hashedPassword.substring(0, 20)}...`);
        
        // Update password
        const result = await collection.updateOne(
          { email: email.toLowerCase() },
          {
            $set: {
              password: hashedPassword,
              updatedAt: new Date()
            }
          }
        );

        console.log(`Update result: modifiedCount=${result.modifiedCount}, matchedCount=${result.matchedCount}`);

        if (result.modifiedCount > 0) {
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
      }

    } catch (error) {
      console.error('Error resetting password:', error);
      return {
        success: false,
        message: `Failed to reset password: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  // Get admin by email
  public async getAdminByEmail(email: string): Promise<AdminUser | null> {
    try {
      await this.ensureConnection();
      
      if (this.useMemoryDb) {
        const admin = await memoryDb.findAdminByEmail(email.toLowerCase());
        if (!admin) return null;
        
        return {
          _id: admin._id,
          email: admin.email,
          name: admin.name,
          password: admin.passwordHash,
          role: 'admin' as const,
          isActive: true,
          createdAt: admin.createdAt,
          updatedAt: new Date()
        };
      } else {
        const collection = this.dbManager.getAdminCollection();
        const admin = await collection.findOne({ email: email.toLowerCase() });
        
        if (!admin) return null;
        
        return {
          _id: admin._id.toString(),
          email: admin.email,
          name: admin.name,
          password: admin.password,
          role: 'admin' as const,
          isActive: true,
          createdAt: admin.createdAt,
          updatedAt: new Date()
        };
      }
    } catch (error) {
      console.error('Error getting admin by email:', error);
      return null;
    }
  }

  // Delete admin account
  public async deleteAdmin(email: string): Promise<{ success: boolean; message: string }> {
    try {
      await this.ensureConnection();
      
      // Check if admin exists
      const existingAdmin = await this.getAdminByEmail(email);
      if (!existingAdmin) {
        return {
          success: false,
          message: 'Admin account not found'
        };
      }

      // Delete from MongoDB
      const collection = this.dbManager.getAdminCollection();
      const result = await collection.deleteOne({ email: email.toLowerCase() });

      if (result.deletedCount === 0) {
        return {
          success: false,
          message: 'Failed to delete admin account'
        };
      }

      return {
        success: true,
        message: 'Admin account deleted successfully'
      };

    } catch (error) {
      console.error('Error deleting admin:', error);
      return {
        success: false,
        message: `Failed to delete admin: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  // Get database status
  public getDatabaseStatus(): { usingMemoryDb: boolean; stats?: any } {
    if (this.useMemoryDb) {
      return {
        usingMemoryDb: true,
        stats: memoryDb.getStats()
      };
    }
    return {
      usingMemoryDb: false
    };
  }
}

export default AdminService;
