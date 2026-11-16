import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {
  UserModel,
  IUser,
  normalizeToPrimaryRole,
  resolvePermissions,
  PrimaryUserRole,
  PermissionProfile,
} from '../../models/User';
import { ENV } from '../../config/env';
import { isMongoConnected } from '../../config/database';
import { UnauthorizedError, ConflictError, NotFoundError } from '../../common/errors';

// In-memory fallback for local mock / detached testing
const memoryUsers = new Map<string, any>();

export class AuthService {
  static async register(data: {
    email: string;
    password: string;
    name: string;
    role?: string;
    primaryRole?: PrimaryUserRole;
    permissionProfile?: PermissionProfile;
    permissions?: string[];
    department?: string;
    facility?: string;
    facilityId?: string;
    districtId?: string;
  }) {
    const email = data.email.toLowerCase();
    if (isMongoConnected) {
      const existing = await UserModel.findOne({ email }).catch(() => null);
      if (existing) {
        throw new ConflictError('User with this email already exists');
      }
    }
    if (memoryUsers.has(email)) {
      throw new ConflictError('User with this email already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const inputRole = data.primaryRole || data.role || 'doctor_referring';
    const { primaryRole, permissionProfile: defaultProfile } = normalizeToPrimaryRole(inputRole);
    const effectiveProfile = data.permissionProfile || defaultProfile;
    const effectivePermissions = resolvePermissions(primaryRole, effectiveProfile, data.permissions);

    let user: any = null;
    if (isMongoConnected) {
      try {
        user = await UserModel.create({
          email,
          passwordHash,
          name: data.name,
          role: data.role || primaryRole,
          primaryRole,
          permissionProfile: effectiveProfile,
          permissions: effectivePermissions,
          department: data.department || (primaryRole === 'doctor_referring' ? 'Pediatrics' : 'NICU'),
          facility: data.facility || (primaryRole === 'doctor_referring' ? 'North Community Health Centre' : 'District Civil Hospital'),
          facilityId: data.facilityId,
          districtId: data.districtId,
        });
      } catch {}
    }

    if (!user) {
      user = {
        _id: 'usr_' + Date.now(),
        email,
        passwordHash,
        name: data.name,
        role: data.role || primaryRole,
        primaryRole,
        permissionProfile: effectiveProfile,
        permissions: effectivePermissions,
        department: data.department || (primaryRole === 'doctor_referring' ? 'Pediatrics' : 'NICU'),
        facility: data.facility || (primaryRole === 'doctor_referring' ? 'North Community Health Centre' : 'District Civil Hospital'),
        facilityId: data.facilityId,
        districtId: data.districtId,
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
    let user: any = null;
    if (isMongoConnected) {
      user = await UserModel.findOne({ email }).catch(() => null);
    }
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

    // Dynamic migration for legacy stored accounts without primaryRole
    if (!user.primaryRole) {
      const { primaryRole, permissionProfile } = normalizeToPrimaryRole(user.role);
      user.primaryRole = primaryRole;
      user.permissionProfile = user.permissionProfile || permissionProfile;
      user.permissions = resolvePermissions(primaryRole, user.permissionProfile, user.permissions);
      if (user.save) {
        await user.save().catch(() => {});
      }
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
      primaryRole: user.primaryRole || normalizeToPrimaryRole(user.role).primaryRole,
      permissionProfile: user.permissionProfile,
      permissions: user.permissions || [],
      department: user.department,
      facility: user.facility,
      facilityId: user.facilityId,
      districtId: user.districtId,
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
    const normalized = user.primaryRole || normalizeToPrimaryRole(user.role).primaryRole;
    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      primaryRole: normalized,
      permissionProfile: user.permissionProfile,
      permissions: user.permissions || resolvePermissions(normalized, user.permissionProfile),
      department: user.department,
      facility: user.facility,
      facilityId: user.facilityId,
      districtId: user.districtId,
    };
  }
}
