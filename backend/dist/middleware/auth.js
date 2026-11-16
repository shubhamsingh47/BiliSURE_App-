"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.authorizeRoles = authorizeRoles;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const errors_1 = require("../common/errors");
function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new errors_1.UnauthorizedError('Authorization header missing or invalid format');
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, env_1.ENV.JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (err) {
        throw new errors_1.UnauthorizedError('Token expired or invalid');
    }
}
function authorizeRoles(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            throw new errors_1.UnauthorizedError('Authentication required');
        }
        if (!roles.includes(req.user.role)) {
            throw new errors_1.ForbiddenError(`Role ${req.user.role} is not authorized to access this resource`);
        }
        next();
    };
}
