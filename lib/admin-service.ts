import MongoDBManager, { AdminUser } from './mongodb-manager';
import bcrypt from 'bcryptjs';

export class AdminService {
  private dbManager: MongoDBManager;

  constructor() {
    this.dbManager = MongoDBManager.getInstance();
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
    await this.dbManager.ensureConnection();
    const collection = this.dbManager.getAdminCollection();

    try {
      // Check if admin already exists
      const existingAdmin = await collection.findOne({ email: email.toLowerCase() });
      
      if (existingAdmin) {
        return {
          success: false,
          message: 'Admin user with this email already exists'
        };
      }

      // Hash password
      const hashedPassword = await this.hashPassword(password);

      // Create admin user
      const adminUser: AdminUser = {
        email: email.toLowerCase(),
        password: hashedPassword,
        name: name,
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      };

      const result = await collection.insertOne(adminUser);
      
      if (result.insertedId) {
        // Return admin without password
        const { password: _, ...adminWithoutPassword } = adminUser;
        return {
          success: true,
          message: 'Admin user created successfully',
          admin: adminWithoutPassword as AdminUser
        };
      } else {
        return {
          success: false,
          message: 'Failed to create admin user'
        };
      }
    } catch (error) {
      console.error('Error creating admin user:', error);
      return {
        success: false,
        message: 'Failed to create admin user'
      };
    }
  }

  // Authenticate admin user
  public async authenticateAdmin(email: string, password: string): Promise<{ success: boolean; message: string; admin?: AdminUser }> {
    await this.dbManager.ensureConnection();
    const collection = this.dbManager.getAdminCollection();

    try {
      // Find admin by email
      const admin = await collection.findOne({ 
        email: email.toLowerCase(),
        isActive: true 
      });

      if (!admin) {
        return {
          success: false,
          message: 'Admin user not found or inactive'
        };
      }

      // Verify password
      const isPasswordValid = await this.verifyPassword(password, admin.password);

      if (!isPasswordValid) {
        return {
          success: false,
          message: 'Invalid password'
        };
      }

      // Return admin without password
      const { password: _, ...adminWithoutPassword } = admin;
      return {
        success: true,
        message: 'Authentication successful',
        admin: adminWithoutPassword as AdminUser
      };
    } catch (error) {
      console.error('Error authenticating admin:', error);
      return {
        success: false,
        message: 'Authentication failed'
      };
    }
  }

  // Get admin by email
  public async getAdminByEmail(email: string): Promise<AdminUser | null> {
    await this.dbManager.ensureConnection();
    const collection = this.dbManager.getAdminCollection();

    try {
      const admin = await collection.findOne({ 
        email: email.toLowerCase(),
        isActive: true 
      });

      if (!admin) {
        return null;
      }

      // Return admin without password
      const { password: _, ...adminWithoutPassword } = admin;
      return adminWithoutPassword as AdminUser;
    } catch (error) {
      console.error('Error getting admin by email:', error);
      return null;
    }
  }

  // Get all admin users
  public async getAllAdmins(): Promise<AdminUser[]> {
    await this.dbManager.ensureConnection();
    const collection = this.dbManager.getAdminCollection();

    try {
      const admins = await collection.find({ isActive: true }).toArray();
      
      // Return admins without passwords
      return admins.map(({ password: _, ...admin }) => admin as AdminUser);
    } catch (error) {
      console.error('Error getting all admins:', error);
      return [];
    }
  }

  // Update admin user
  public async updateAdmin(email: string, updates: Partial<Omit<AdminUser, '_id' | 'email' | 'createdAt'>>): Promise<{ success: boolean; message: string }> {
    await this.dbManager.ensureConnection();
    const collection = this.dbManager.getAdminCollection();

    try {
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

  // Deactivate admin user
  public async deactivateAdmin(email: string): Promise<{ success: boolean; message: string }> {
    return this.updateAdmin(email, { isActive: false });
  }
}

export default AdminService;
