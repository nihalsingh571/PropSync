import { Conversation, Message } from '../models/messageModel.js';
import Tenant from '../models/tenantModel.js';
import Property from '../models/propertyModel.js';
import { emitChatMessage } from '../services/realtimeService.js';

// ── GET /api/messages/conversations ──────────────────────────────────────────
export const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id
    })
      .populate('participants', 'name email')
      .populate('propertyId', 'name address')
      .sort({ lastMessageAt: -1 })
      .lean();

    // Attach unread count for each conversation
    const withUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unread = await Message.countDocuments({
          conversationId: conv._id,
          readBy: { $ne: req.user._id },
          senderId: { $ne: req.user._id }
        });
        return { ...conv, unreadCount: unread };
      })
    );

    return res.json(withUnread);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ── GET /api/messages/conversations/:id ───────────────────────────────────────
export const getMessages = async (req, res) => {
  try {
    const conv = await Conversation.findById(req.params.id);
    if (!conv) return res.status(404).json({ message: 'Conversation not found' });

    // Only participants can read messages
    const isParticipant = conv.participants.some(
      (p) => p.toString() === req.user._id.toString()
    );
    if (!isParticipant) return res.status(403).json({ message: 'Access denied' });

    const messages = await Message.find({ conversationId: req.params.id })
      .populate('senderId', 'name email')
      .sort({ createdAt: 1 })
      .lean();

    // Mark unread messages as read
    await Message.updateMany(
      {
        conversationId: req.params.id,
        senderId: { $ne: req.user._id },
        readBy: { $ne: req.user._id }
      },
      { $addToSet: { readBy: req.user._id } }
    );

    return res.json(messages);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ── POST /api/messages/conversations/:id/send ─────────────────────────────────
export const sendMessage = async (req, res) => {
  try {
    const conv = await Conversation.findById(req.params.id);
    if (!conv) return res.status(404).json({ message: 'Conversation not found' });

    const isParticipant = conv.participants.some(
      (p) => p.toString() === req.user._id.toString()
    );
    if (!isParticipant) return res.status(403).json({ message: 'Access denied' });

    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ message: 'Message content is required' });

    const message = await Message.create({
      conversationId: conv._id,
      senderId: req.user._id,
      content: content.trim(),
      readBy: [req.user._id]
    });

    // Update conversation's last message
    await Conversation.findByIdAndUpdate(conv._id, {
      lastMessage: content.trim().substring(0, 100),
      lastMessageAt: new Date()
    });

    // Populate sender for the response
    const populated = await message.populate('senderId', 'name email');

    // Emit real-time event to the other participant
    const receiverId = conv.participants.find(
      (p) => p.toString() !== req.user._id.toString()
    );
    if (receiverId) {
      emitChatMessage(receiverId.toString(), {
        conversationId: conv._id.toString(),
        message: populated
      });
    }

    return res.status(201).json(populated);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ── GET /api/messages/unread-count ────────────────────────────────────────────
export const getUnreadCount = async (req, res) => {
  try {
    const conversations = await Conversation.find({ participants: req.user._id }, '_id');
    const convIds = conversations.map((c) => c._id);
    const count = await Message.countDocuments({
      conversationId: { $in: convIds },
      senderId: { $ne: req.user._id },
      readBy: { $ne: req.user._id }
    });
    return res.json({ count });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ── POST /api/messages/tenant/start-chat ──────────────────────────────────────
export const startTenantChat = async (req, res) => {
  try {
    const tenant = await Tenant.findOne({ userId: req.user._id, status: { $in: ['active', 'notice_period'] } });
    if (!tenant) return res.status(403).json({ message: 'You do not have an active lease.' });

    const property = await Property.findById(tenant.propertyId);
    if (!property) return res.status(404).json({ message: 'Property not found.' });

    let conv = await Conversation.findOne({
      participants: { $all: [req.user._id, property.ownerId] }
    });

    if (!conv) {
      conv = await Conversation.create({
        participants: [req.user._id, property.ownerId],
        propertyId: property._id
      });
    }

    return res.json({ conversationId: conv._id });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
