import { NotificationModel, INotification, NotificationType } from '../../models/Notification';
import { isMongoConnected } from '../../config/database';

const memoryNotifications: INotification[] = [];

const SEED_NOTIFICATIONS = [
  {
    _id: 'notif_001',
    recipientRole: 'hospital_doctor',
    hospitalId: 'hosp_001',
    title: 'New Urgent Referral: Pooja Sharma (BS-IN-656522)',
    message: 'Transferred from East PHC. Bilirubin 17.5 mg/dL at 36h (High Risk Zone). Immediate phototherapy review recommended.',
    type: 'referral_created' as NotificationType,
    relatedBabyUhid: 'BS-IN-656522',
    relatedReferralId: 'REF-2026-0082',
    isRead: false,
    createdAt: new Date(Date.now() - 3600000 * 1),
  },
  {
    _id: 'notif_002',
    recipientRole: 'referring_doctor',
    centreName: 'North Community Health Centre (CHC)',
    title: 'Referral Accepted: Sunita Devi',
    message: 'District Civil Hospital accepted Sunita Devi (BS-IN-972612). Neonatal transport may proceed.',
    type: 'referral_accepted' as NotificationType,
    relatedBabyUhid: 'BS-IN-972612',
    relatedReferralId: 'REF-2026-0081',
    isRead: true,
    createdAt: new Date(Date.now() - 3600000 * 2),
  },
];

if (memoryNotifications.length === 0) {
  memoryNotifications.push(...(SEED_NOTIFICATIONS as any));
}

export class NotificationsService {
  static async createNotification(data: {
    recipientRole?: string;
    hospitalId?: string;
    centreName?: string;
    title: string;
    message: string;
    type: NotificationType;
    relatedBabyUhid?: string;
    relatedReferralId?: string;
  }) {
    const newNotif: any = {
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

    if (isMongoConnected) {
      try {
        await NotificationModel.create(newNotif);
      } catch {}
    }

    memoryNotifications.unshift(newNotif);
    return newNotif;
  }

  static async listNotifications(role?: string, hospitalId?: string) {
    let list = memoryNotifications;
    if (role && role !== 'admin') {
      list = list.filter((n) => {
        if (!n.recipientRole) return true;
        if (n.recipientRole === role) return true;
        // Primary role to legacy mapping
        if (role === 'receiving_hospital' && n.recipientRole.startsWith('hospital_')) return true;
        if (role.startsWith('hospital_') && n.recipientRole === 'receiving_hospital') return true;
        if (role === 'doctor_referring' && (n.recipientRole === 'referring_doctor' || n.recipientRole === 'doctor')) return true;
        if ((role === 'referring_doctor' || role === 'doctor') && n.recipientRole === 'doctor_referring') return true;
        if (role === 'district_admin' && n.recipientRole === 'admin') return true;
        return false;
      });
    }
    if (hospitalId) {
      list = list.filter((n) => !n.hospitalId || String(n.hospitalId) === String(hospitalId));
    }
    return list;
  }

  static async markAsRead(id: string) {
    const notif = memoryNotifications.find((n) => (n as any)._id === id || n.id === id);
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
