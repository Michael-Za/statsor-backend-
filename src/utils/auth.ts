// Authentication utilities for TeamPlaymate
// Handles password recovery, user authentication, and security features

import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { emailAutomationService } from './email';
import { queryCacheService } from './database';

// Validation schemas
const PasswordRecoveryRequestSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const PasswordResetSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Password confirmation is required'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const RegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Password confirmation is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

// User interface
interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  lastLoginAt?: Date;
  emailVerified: boolean;
}

// JWT payload interface
interface JWTPayload {
  userId: string;
  email: string;
  name: string;
  iat: number;
  exp: number;
}

// Authentication response interface
interface AuthResponse {
  success: boolean;
  message: string;
  user?: Omit<User, 'password'>;
  token?: string;
  refreshToken?: string;
}

class AuthService {
  private jwtSecret: string;
  private jwtExpiresIn: string;
  private saltRounds: number;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';
    this.saltRounds = 12;
  }

  // Hash password
  async hashPassword(password: string): Promise<string> {
    try {
      const salt = await bcrypt.genSalt(this.saltRounds);
      return await bcrypt.hash(password, salt);
    } catch (error) {
      console.error('Failed to hash password:', error);
      throw new Error('Password hashing failed');
    }
  }

  // Verify password
  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
      console.error('Failed to verify password:', error);
      return false;
    }
  }

  // Generate JWT token
  generateToken(user: Omit<User, 'password'>): string {
    try {
      const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
        userId: user.id,
        email: user.email,
        name: user.name,
      };

      return jwt.sign(payload, this.jwtSecret, {
        expiresIn: this.jwtExpiresIn,
      });
    } catch (error) {
      console.error('Failed to generate token:', error);
      throw new Error('Token generation failed');
    }
  }

  // Verify JWT token
  verifyToken(token: string): JWTPayload | null {
    try {
      return jwt.verify(token, this.jwtSecret) as JWTPayload;
    } catch (error) {
      console.error('Failed to verify token:', error);
      return null;
    }
  }

  // Generate refresh token
  generateRefreshToken(userId: string): string {
    try {
      return jwt.sign({ userId }, this.jwtSecret, {
        expiresIn: '30d', // Refresh tokens last longer
      });
    } catch (error) {
      console.error('Failed to generate refresh token:', error);
      throw new Error('Refresh token generation failed');
    }
  }

  // Register new user
  async register(userData: z.infer<typeof RegisterSchema>): Promise<AuthResponse> {
    try {
      // Validate input
      const validatedData = RegisterSchema.parse(userData);

      // Check if user already exists
      const existingUser = await this.getUserByEmail(validatedData.email);
      if (existingUser) {
        return {
          success: false,
          message: 'User with this email already exists',
        };
      }

      // Hash password
      const hashedPassword = await this.hashPassword(validatedData.password);

      // Create user (this would typically interact with your database)
      const newUser: User = {
        id: this.generateUserId(),
        name: validatedData.name,
        email: validatedData.email,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        emailVerified: false,
      };

      // Save user to database (implement based on your database)
      await this.saveUser(newUser);

      // Generate tokens
      const userWithoutPassword = this.excludePassword(newUser);
      const token = this.generateToken(userWithoutPassword);
      const refreshToken = this.generateRefreshToken(newUser.id);

      // Send welcome email (if not subscribing to a plan)
      // Note: If user is registering through subscription, welcome email will be sent there
      
      return {
        success: true,
        message: 'User registered successfully',
        user: userWithoutPassword,
        token,
        refreshToken,
      };
    } catch (error) {
      console.error('Registration failed:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Registration failed',
      };
    }
  }

  // Login user
  async login(credentials: z.infer<typeof LoginSchema>): Promise<AuthResponse> {
    try {
      // Validate input
      const validatedCredentials = LoginSchema.parse(credentials);

      // Get user by email
      const user = await this.getUserByEmail(validatedCredentials.email);
      if (!user) {
        return {
          success: false,
          message: 'Invalid email or password',
        };
      }

      // Check if user is active
      if (!user.isActive) {
        return {
          success: false,
          message: 'Account is deactivated. Please contact support.',
        };
      }

      // Verify password
      const isPasswordValid = await this.verifyPassword(
        validatedCredentials.password,
        user.password
      );

      if (!isPasswordValid) {
        return {
          success: false,
          message: 'Invalid email or password',
        };
      }

      // Update last login
      await this.updateLastLogin(user.id);

      // Generate tokens
      const userWithoutPassword = this.excludePassword(user);
      const token = this.generateToken(userWithoutPassword);
      const refreshToken = this.generateRefreshToken(user.id);

      return {
        success: true,
        message: 'Login successful',
        user: userWithoutPassword,
        token,
        refreshToken,
      };
    } catch (error) {
      console.error('Login failed:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Login failed',
      };
    }
  }

  // Request password recovery
  async requestPasswordRecovery(
    requestData: z.infer<typeof PasswordRecoveryRequestSchema>
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Validate input
      const validatedData = PasswordRecoveryRequestSchema.parse(requestData);

      // Get user by email
      const user = await this.getUserByEmail(validatedData.email);
      if (!user) {
        // Don't reveal if email exists or not for security
        return {
          success: true,
          message: 'If an account with this email exists, a recovery email has been sent.',
        };
      }

      // Check if user is active
      if (!user.isActive) {
        return {
          success: false,
          message: 'Account is deactivated. Please contact support.',
        };
      }

      // Send password recovery email
      const emailResult = await emailAutomationService.handlePasswordRecovery(
        user.id,
        user.email,
        user.name
      );

      if (!emailResult) {
        return {
          success: false,
          message: 'Failed to send recovery email. Please try again.',
        };
      }

      return {
        success: true,
        message: 'Recovery email sent successfully. Please check your inbox.',
      };
    } catch (error) {
      console.error('Password recovery request failed:', error);
      return {
        success: false,
        message: 'Failed to process recovery request. Please try again.',
      };
    }
  }

  // Reset password with token
  async resetPassword(
    resetData: z.infer<typeof PasswordResetSchema>
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Validate input
      const validatedData = PasswordResetSchema.parse(resetData);

      // Validate recovery token
      const tokenData = emailAutomationService.validateRecoveryToken(validatedData.token);
      if (!tokenData) {
        return {
          success: false,
          message: 'Invalid or expired recovery token.',
        };
      }

      // Get user
      const user = await this.getUserById(tokenData.userId);
      if (!user || user.email !== tokenData.email) {
        return {
          success: false,
          message: 'Invalid recovery token.',
        };
      }

      // Hash new password
      const hashedPassword = await this.hashPassword(validatedData.newPassword);

      // Update user password
      await this.updateUserPassword(user.id, hashedPassword);

      // Mark token as used
      emailAutomationService.useRecoveryToken(validatedData.token);

      // Send confirmation email
      await emailAutomationService.handlePasswordResetSuccess(user.email, user.name);

      // Invalidate all existing sessions (optional security measure)
      await this.invalidateUserSessions(user.id);

      return {
        success: true,
        message: 'Password reset successfully. You can now log in with your new password.',
      };
    } catch (error) {
      console.error('Password reset failed:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Password reset failed',
      };
    }
  }

  // Refresh access token
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, this.jwtSecret) as { userId: string };
      
      // Get user
      const user = await this.getUserById(decoded.userId);
      if (!user || !user.isActive) {
        return {
          success: false,
          message: 'Invalid refresh token',
        };
      }

      // Generate new tokens
      const userWithoutPassword = this.excludePassword(user);
      const newToken = this.generateToken(userWithoutPassword);
      const newRefreshToken = this.generateRefreshToken(user.id);

      return {
        success: true,
        message: 'Token refreshed successfully',
        user: userWithoutPassword,
        token: newToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      console.error('Token refresh failed:', error);
      return {
        success: false,
        message: 'Invalid refresh token',
      };
    }
  }

  // Logout (invalidate tokens)
  async logout(userId: string): Promise<{ success: boolean; message: string }> {
    try {
      // Invalidate user sessions (implement based on your session storage)
      await this.invalidateUserSessions(userId);

      return {
        success: true,
        message: 'Logged out successfully',
      };
    } catch (error) {
      console.error('Logout failed:', error);
      return {
        success: false,
        message: 'Logout failed',
      };
    }
  }

  // Helper methods (implement based on your database)
  private async getUserByEmail(email: string): Promise<User | null> {
    // Implement database query to get user by email
    // This is a placeholder - replace with actual database implementation
    try {
      // Check cache first
      const cacheKey = `user:email:${email}`;
      const cachedUser = await queryCacheService.get(cacheKey);
      if (cachedUser) {
        return JSON.parse(cachedUser);
      }

      // Query database (implement based on your database)
      // const user = await db.query('SELECT * FROM users WHERE email = $1', [email]);
      // 
      // if (user) {
      //   await queryCacheService.set(cacheKey, JSON.stringify(user), 300); // Cache for 5 minutes
      // }
      // 
      // return user;

      // Placeholder return
      return null;
    } catch (error) {
      console.error('Failed to get user by email:', error);
      return null;
    }
  }

  private async getUserById(id: string): Promise<User | null> {
    // Implement database query to get user by ID
    try {
      // Check cache first
      const cacheKey = `user:id:${id}`;
      const cachedUser = await queryCacheService.get(cacheKey);
      if (cachedUser) {
        return JSON.parse(cachedUser);
      }

      // Query database (implement based on your database)
      // const user = await db.query('SELECT * FROM users WHERE id = $1', [id]);
      // 
      // if (user) {
      //   await queryCacheService.set(cacheKey, JSON.stringify(user), 300);
      // }
      // 
      // return user;

      // Placeholder return
      return null;
    } catch (error) {
      console.error('Failed to get user by ID:', error);
      return null;
    }
  }

  private async saveUser(user: User): Promise<void> {
    // Implement database save operation
    try {
      // Insert user into database
      // await db.query(
      //   'INSERT INTO users (id, name, email, password, created_at, updated_at, is_active, email_verified) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      //   [user.id, user.name, user.email, user.password, user.createdAt, user.updatedAt, user.isActive, user.emailVerified]
      // );

      // Invalidate cache
      await queryCacheService.delete(`user:email:${user.email}`);
      await queryCacheService.delete(`user:id:${user.id}`);

      console.log(`User saved: ${user.email}`);
    } catch (error) {
      console.error('Failed to save user:', error);
      throw error;
    }
  }

  private async updateUserPassword(userId: string, hashedPassword: string): Promise<void> {
    // Implement password update
    try {
      // Update password in database
      // await db.query(
      //   'UPDATE users SET password = $1, updated_at = $2 WHERE id = $3',
      //   [hashedPassword, new Date(), userId]
      // );

      // Invalidate cache
      await queryCacheService.delete(`user:id:${userId}`);

      console.log(`Password updated for user: ${userId}`);
    } catch (error) {
      console.error('Failed to update password:', error);
      throw error;
    }
  }

  private async updateLastLogin(userId: string): Promise<void> {
    // Implement last login update
    try {
      // Update last login in database
      // await db.query(
      //   'UPDATE users SET last_login_at = $1 WHERE id = $2',
      //   [new Date(), userId]
      // );

      // Invalidate cache
      await queryCacheService.delete(`user:id:${userId}`);

      console.log(`Last login updated for user: ${userId}`);
    } catch (error) {
      console.error('Failed to update last login:', error);
    }
  }

  private async invalidateUserSessions(userId: string): Promise<void> {
    // Implement session invalidation (if using session storage)
    try {
      // Remove all sessions for user
      // This could involve:
      // 1. Removing from Redis session store
      // 2. Adding token to blacklist
      // 3. Updating database session table
      
      console.log(`Sessions invalidated for user: ${userId}`);
    } catch (error) {
      console.error('Failed to invalidate sessions:', error);
    }
  }

  private generateUserId(): string {
    // Generate unique user ID
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private excludePassword(user: User): Omit<User, 'password'> {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}

// Middleware for protecting routes
export const authenticateToken = (token: string): JWTPayload | null => {
  const authService = new AuthService();
  return authService.verifyToken(token);
};

// Export singleton instance
export const authService = new AuthService();

// Export validation schemas
export {
  PasswordRecoveryRequestSchema,
  PasswordResetSchema,
  LoginSchema,
  RegisterSchema,
};

// Export types
export type {
  User,
  AuthResponse,
  JWTPayload,
};