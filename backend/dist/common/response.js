"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSuccess = sendSuccess;
exports.sendError = sendError;
function sendSuccess(res, data, statusCode = 200, message, pagination) {
    const payload = {
        success: true,
        data,
        message,
        pagination,
    };
    res.status(statusCode).json(payload);
}
function sendError(res, statusCode, message, code = 'ERROR', details) {
    const payload = {
        success: false,
        error: {
            code,
            message,
            details,
        },
    };
    res.status(statusCode).json(payload);
}
