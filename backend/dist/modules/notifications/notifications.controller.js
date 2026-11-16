"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsController = void 0;
const notifications_service_1 = require("./notifications.service");
const response_1 = require("../../common/response");
class NotificationsController {
    static async list(req, res, next) {
        try {
            const { role, hospitalId } = req.query;
            const list = await notifications_service_1.NotificationsService.listNotifications(role ? String(role) : undefined, hospitalId ? String(hospitalId) : undefined);
            return (0, response_1.sendSuccess)(res, list, 200);
        }
        catch (err) {
            next(err);
        }
    }
    static async markRead(req, res, next) {
        try {
            const notif = await notifications_service_1.NotificationsService.markAsRead(String(req.params.id));
            return (0, response_1.sendSuccess)(res, notif, 200, 'Notification marked as read');
        }
        catch (err) {
            next(err);
        }
    }
    static async markAllRead(req, res, next) {
        try {
            const resData = await notifications_service_1.NotificationsService.markAllAsRead();
            return (0, response_1.sendSuccess)(res, resData, 200, 'All notifications marked as read');
        }
        catch (err) {
            next(err);
        }
    }
}
exports.NotificationsController = NotificationsController;
