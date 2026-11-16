"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const errors_1 = require("../common/errors");
const response_1 = require("../common/response");
function errorHandler(err, req, res, next) {
    if (err instanceof errors_1.AppError) {
        (0, response_1.sendError)(res, err.statusCode, err.message, err.code, err.details);
        return;
    }
    console.error('[UnhandledError]', err);
    (0, response_1.sendError)(res, 500, 'An unexpected server error occurred', 'INTERNAL_SERVER_ERROR', process.env.NODE_ENV === 'development' ? err.stack : undefined);
}
