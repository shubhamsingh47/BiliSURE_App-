"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("./auth.service");
const response_1 = require("../../common/response");
class AuthController {
    static async register(req, res, next) {
        try {
            const result = await auth_service_1.AuthService.register(req.body);
            (0, response_1.sendSuccess)(res, result, 201, 'User registered successfully');
        }
        catch (err) {
            next(err);
        }
    }
    static async login(req, res, next) {
        try {
            const { email, password } = req.body;
            const result = await auth_service_1.AuthService.login(email, password);
            (0, response_1.sendSuccess)(res, result, 200, 'Login successful');
        }
        catch (err) {
            next(err);
        }
    }
    static async refresh(req, res, next) {
        try {
            const { refreshToken } = req.body;
            const result = await auth_service_1.AuthService.refreshToken(refreshToken);
            (0, response_1.sendSuccess)(res, result, 200, 'Token refreshed successfully');
        }
        catch (err) {
            next(err);
        }
    }
    static async getProfile(req, res, next) {
        try {
            (0, response_1.sendSuccess)(res, req.user, 200, 'Profile fetched successfully');
        }
        catch (err) {
            next(err);
        }
    }
}
exports.AuthController = AuthController;
