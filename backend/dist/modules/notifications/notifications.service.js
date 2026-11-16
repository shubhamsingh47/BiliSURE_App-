"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const Notification_1 = require("../../models/Notification");
const database_1 = require("../../config/database");
const memoryNotifications = [];
const SEED_NOTIFICATIONS = [
    {
        _id: 'notif_001',
        recipientRole: 'hospital_doctor',
        hospitalId: 'hosp_001',
        title: 'New Urgent Referral: Baby 2 (B9C8D7E6F5)',
        message: 'Transferred from East PHC. Bilirubin 17.5 mg/dL at 36h (High Risk Zone). Immediate phototherapy review recommended.',
        type: 'referral_created',
        relatedBabyUhid: 'B9C8D7E6F5',
        relatedReferralId: 'REF-2026-0082',
        isRead: false,
        createdAt: new Date(Date.now() - 3600000 * 1),
    },
    {
        _id: 'notif_002',
        recipientRole: 'referring_doctor',
        centreName: 'North Community Health Centre (CHC)',
        title: 'Referral Accepted: Baby 1',
        message: 'District Civil Hospital accepted Baby 1 (M1A2N3S4I5). Neonatal transport may proceed.',
        type: 'referral_accepted',
        relatedBabyUhid: 'M1A2N3S4I5',
        relatedReferralId: 'REF-2026-0081',
        isRead: true,
        createdAt: new Date(Date.now() - 3600000 * 2),
    },
];
if (memoryNotifications.length === 0) {
    memoryNotifications.push(...SEED_NOTIFICATIONS);
}
class NotificationsService {
    static async createNotification(data) {
        const newNotif = {
            _id: 'notif_' + Date.now(),
            recipientRole: data.recipientRole,
            hospitalId: data.hospitalId,
            centreName: data.centreName,
            title: data.title,
            message: data.message,
            type: data.type,
            relatedBabyUhid: data.relatedBabyUhid,
            relatedReferralId: data.relatedReferralId,
            isRead: false,
            createdAt: new Date(),
        };
        if (database_1.isMongoConnected) {
            try {
                await Notification_1.NotificationModel.create(newNotif);
            }
            catch { }
        }
        memoryNotifications.unshift(newNotif);
        return newNotif;
    }
    static async listNotifications(role, hospitalId) {
        let list = memoryNotifications;
        if (role && role !== 'admin') {
            list = list.filter((n) => {
                if (!n.recipientRole)
                    return true;
                if (n.recipientRole === role)
                    return true;
                // Primary role to legacy mapping
                if (role === 'receiving_hospital' && n.recipientRole.startsWith('hospital_'))
                    return true;
                if (role.startsWith('hospital_') && n.recipientRole === 'receiving_hospital')
                    return true;
                if (role === 'doctor_referring' && (n.recipientRole === 'referring_doctor' || n.recipientRole === 'doctor'))
                    return true;
                if ((role === 'referring_doctor' || role === 'doctor') && n.recipientRole === 'doctor_referring')
                    return true;
                if (role === 'district_admin' && n.recipientRole === 'admin')
                    return true;
                return false;
            });
        }
        if (hospitalId) {
            list = list.filter((n) => !n.hospitalId || String(n.hospitalId) === String(hospitalId));
        }
        return list;
    }
    static async markAsRead(id) {
        const notif = memoryNotifications.find((n) => n._id === id || n.id === id);
        if (notif) {
            notif.isRead = true;
        }
        return notif;
    }
    static async markAllAsRead() {
        memoryNotifications.forEach((n) => (n.isRead = true));
        return { marked: memoryNotifications.length };
    }
}
exports.NotificationsService = NotificationsService;
