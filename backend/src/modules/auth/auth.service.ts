import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserModel, IUser } from '../../models/User.js';
import { ENV } from '../../config/env.js';
import { UnauthorizedError, ConflictError, NotFoundError } from '../../common/errors.js';

// In-memory fallback for local mock / detached testing
const memoryUsers = new Map<string, any>();

export class AuthService {
  static async register(data: {
    email: string;
    password: string;
    name: string;
    role?: 'admin' | 'doctor' | 'nurse' | 'caregiver';
    department?: string;
    facility?: string;
  }) {
    const email = data.email.toLowerCase();
    const existing = await UserModel.findOne({ email }).catch(() => null);
    if (existing || memoryUsers.has(email)) {
      throw new ConflictError('User with this email already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    let user: any;
    try {
      user = await UserModel.create({
        email,
        passwordHash,
        name: data.name,
        role: data.role || 'nurse',
        department: data.department || 'NICU',
        facility: data.facility || 'Central Children Hospital',
      });
    } catch {
      user = {
        _id: 'usr_' + Date.now(),
        email,
        passwordHash,
        name: data.name,
        role: data.role || 'nurse',
        department: data.department || 'NICU',
        facility: data.facility || 'Central Children Hospital',
      };
      memoryUsers.set(email, user);
    }

    const tokens = this.generateTokens(user);
    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  static async login(emailInput: string, passwordInput: string) {
    const email = emailInput.toLowerCase();
    let user = await UserModel.findOne({ email }).catch(() => null);
    if (!user && memoryUsers.has(email)) {
      user = memoryUsers.get(email);
    }

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(passwordInput, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const tokens = this.generateTokens(user);
    if (user.save) {
      user.refreshToken = tokens.refreshToken;
      await user.save().catch(() => {});
    }

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  static async refreshToken(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, ENV.JWT_REFRESH_SECRET) as any;
      let user = await UserModel.findById(decoded.userId).catch(() => null);
      if (!user && memoryUsers.has(decoded.email)) {
        user = memoryUsers.get(decoded.email);
      }

      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      const tokens = this.generateTokens(user);
      return tokens;
    } catch {
      throw new UnauthorizedError('Refresh token invalid or expired');
    }
  }

  private static generateTokens(user: any) {
    const payload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      department: user.department,
      facility: user.facility,
    };

    const accessToken = jwt.sign(payload, ENV.JWT_SECRET, {
      expiresIn: '1h',
    });

    const refreshToken = jwt.sign(payload, ENV.JWT_REFRESH_SECRET, {
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }

  private static sanitizeUser(user: any) {
    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
      facility: user.facility,
    };
  }
}
