"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../../models/User");
const env_1 = require("../../config/env");
const database_1 = require("../../config/database");
const errors_1 = require("../../common/errors");
// In-memory fallback for local mock / detached testing
const memoryUsers = new Map();
class AuthService {
    static async register(data) {
        const email = data.email.toLowerCase();
        if (database_1.isMongoConnected) {
            const existing = await User_1.UserModel.findOne({ email }).catch(() => null);
            if (existing) {
                throw new errors_1.ConflictError('User with this email already exists');
            }
        }
        if (memoryUsers.has(email)) {
            throw new errors_1.ConflictError('User with this email already exists');
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const passwordHash = await bcryptjs_1.default.hash(data.password, salt);
        const inputRole = data.primaryRole || data.role || 'doctor_referring';
        const { primaryRole, permissionProfile: defaultProfile } = (0, User_1.normalizeToPrimaryRole)(inputRole);
        const effectiveProfile = data.permissionProfile || defaultProfile;
        const effectivePermissions = (0, User_1.resolvePermissions)(primaryRole, effectiveProfile, data.permissions);
        let user = null;
        if (database_1.isMongoConnected) {
            try {
                user = await User_1.UserModel.create({
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
            }
            catch { }
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
    static async login(emailInput, passwordInput) {
        const email = emailInput.toLowerCase();
        let user = null;
        if (database_1.isMongoConnected) {
            user = await User_1.UserModel.findOne({ email }).catch(() => null);
        }
        if (!user && memoryUsers.has(email)) {
            user = memoryUsers.get(email);
        }
        if (!user) {
            throw new errors_1.UnauthorizedError('Invalid email or password');
        }
        const isMatch = await bcryptjs_1.default.compare(passwordInput, user.passwordHash);
        if (!isMatch) {
            throw new errors_1.UnauthorizedError('Invalid email or password');
        }
        // Dynamic migration for legacy stored accounts without primaryRole
        if (!user.primaryRole) {
            const { primaryRole, permissionProfile } = (0, User_1.normalizeToPrimaryRole)(user.role);
            user.primaryRole = primaryRole;
            user.permissionProfile = user.permissionProfile || permissionProfile;
            user.permissions = (0, User_1.resolvePermissions)(primaryRole, user.permissionProfile, user.permissions);
            if (user.save) {
                await user.save().catch(() => { });
            }
        }
        const tokens = this.generateTokens(user);
        if (user.save) {
            user.refreshToken = tokens.refreshToken;
            await user.save().catch(() => { });
        }
        return {
            user: this.sanitizeUser(user),
            ...tokens,
        };
    }
    static async refreshToken(refreshToken) {
        try {
            const decoded = jsonwebtoken_1.default.verify(refreshToken, env_1.ENV.JWT_REFRESH_SECRET);
            let user = await User_1.UserModel.findById(decoded.userId).catch(() => null);
            if (!user && memoryUsers.has(decoded.email)) {
                user = memoryUsers.get(decoded.email);
            }
            if (!user) {
                throw new errors_1.UnauthorizedError('User not found');
            }
            const tokens = this.generateTokens(user);
            return tokens;
        }
        catch {
            throw new errors_1.UnauthorizedError('Refresh token invalid or expired');
        }
    }
    static generateTokens(user) {
        const payload = {
            userId: user._id.toString(),
            email: user.email,
            role: user.role,
            primaryRole: user.primaryRole || (0, User_1.normalizeToPrimaryRole)(user.role).primaryRole,
            permissionProfile: user.permissionProfile,
            permissions: user.permissions || [],
            department: user.department,
            facility: user.facility,
            facilityId: user.facilityId,
            districtId: user.districtId,
        };
        const accessToken = jsonwebtoken_1.default.sign(payload, env_1.ENV.JWT_SECRET, {
            expiresIn: '1h',
        });
        const refreshToken = jsonwebtoken_1.default.sign(payload, env_1.ENV.JWT_REFRESH_SECRET, {
            expiresIn: '7d',
        });
        return { accessToken, refreshToken };
    }
    static sanitizeUser(user) {
        const normalized = user.primaryRole || (0, User_1.normalizeToPrimaryRole)(user.role).primaryRole;
        return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
            primaryRole: normalized,
            permissionProfile: user.permissionProfile,
            permissions: user.permissions || (0, User_1.resolvePermissions)(normalized, user.permissionProfile),
            department: user.department,
            facility: user.facility,
            facilityId: user.facilityId,
            districtId: user.districtId,
        };
    }
}
exports.AuthService = AuthService;
