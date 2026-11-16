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
const errors_1 = require("../../common/errors");
// In-memory fallback for local mock / detached testing
const memoryUsers = new Map();
class AuthService {
    static async register(data) {
        const email = data.email.toLowerCase();
        const existing = await User_1.UserModel.findOne({ email }).catch(() => null);
        if (existing || memoryUsers.has(email)) {
            throw new errors_1.ConflictError('User with this email already exists');
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const passwordHash = await bcryptjs_1.default.hash(data.password, salt);
        let user;
        try {
            user = await User_1.UserModel.create({
                email,
                passwordHash,
                name: data.name,
                role: data.role || 'nurse',
                department: data.department || 'NICU',
                facility: data.facility || 'Central Children Hospital',
            });
        }
        catch {
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
    static async login(emailInput, passwordInput) {
        const email = emailInput.toLowerCase();
        let user = await User_1.UserModel.findOne({ email }).catch(() => null);
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
            department: user.department,
            facility: user.facility,
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
exports.AuthService = AuthService;
