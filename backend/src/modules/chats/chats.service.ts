import { Types } from 'mongoose';
import { ChatMessageModel, IChatMessage } from '../../models/ChatMessage';

export class ChatsService {
  static async getMessages(userFacility: string, channel = 'general', limit = 50) {
    const facilityUpper = (userFacility || '').trim().toUpperCase();
    const isDistrict = facilityUpper.includes('DISTRICT') || facilityUpper.includes('ADMIN') || facilityUpper === 'ALL';

    const filter: any = {};
    if (channel && channel !== 'all') {
      filter.channel = channel;
    }

    if (!isDistrict) {
      // Hospital user sees public messages (recipientFacility: 'ALL'), or messages specifically for/from their facility
      filter.$or = [
        { recipientFacility: 'ALL' },
        { recipientFacility: new RegExp(`^${userFacility}$`, 'i') },
        { senderFacility: new RegExp(`^${userFacility}$`, 'i') },
      ];
    }

    const messages = await ChatMessageModel.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return messages.reverse();
  }

  static async sendMessage(data: {
    senderId: string;
    senderName: string;
    senderRole: string;
    senderFacility: string;
    recipientFacility?: string;
    channel?: string;
    message: string;
    relatedBabyUhid?: string;
    relatedReferralId?: string;
  }) {
    const message = await ChatMessageModel.create({
      senderId: data.senderId,
      senderName: data.senderName,
      senderRole: data.senderRole,
      senderFacility: data.senderFacility,
      recipientFacility: data.recipientFacility || 'ALL',
      channel: data.channel || 'general',
      message: data.message,
      relatedBabyUhid: data.relatedBabyUhid,
      relatedReferralId: data.relatedReferralId,
      isRead: false,
    });

    return message.toObject();
  }

  static async markAsRead(messageId: string) {
    if (Types.ObjectId.isValid(messageId)) {
      await ChatMessageModel.findByIdAndUpdate(messageId, { isRead: true });
    }
  }
}
