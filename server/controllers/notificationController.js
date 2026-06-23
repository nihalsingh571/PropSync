// server/controllers/notificationController.js — PropSync v2
import * as notificationService from '../services/notificationService.js';

const isAdmin = u => u?.roles?.includes('admin') || u?.isAdmin === true;

// GET /api/notifications/unread-count
export const getUnreadCount = async (req, res) => {
  try {
    const result = await notificationService.getUnreadCount(req.user._id);
    return res.json(result);
  } catch (e) { return res.status(500).json({ message: e.message }); }
};

// GET /api/notifications
export const listNotifications = async (req, res) => {
  try {
    const { unreadOnly, page, limit } = req.query;
    const result = await notificationService.listNotifications({
      recipientId: req.user._id,
      unreadOnly: unreadOnly === 'true',
      page: page || 1,
      limit: limit || 20
    });
    return res.json(result);
  } catch (e) { return res.status(500).json({ message: e.message }); }
};

// PATCH /api/notifications/:id/read
export const markRead = async (req, res) => {
  try {
    const notification = await notificationService.markRead(req.params.id, req.user._id);
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    return res.json({ message: 'Marked as read', notification });
  } catch (e) { return res.status(500).json({ message: e.message }); }
};

// PATCH /api/notifications/mark-all-read
export const markAllRead = async (req, res) => {
  try {
    const result = await notificationService.markAllRead(req.user._id);
    return res.json({ message: `${result.modifiedCount} notifications marked as read`, ...result });
  } catch (e) { return res.status(500).json({ message: e.message }); }
};

// DELETE /api/notifications/:id
export const deleteNotification = async (req, res) => {
  try {
    const notification = await notificationService.deleteNotification(
      req.params.id, req.user._id, isAdmin(req.user)
    );
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    return res.json({ message: 'Notification deleted' });
  } catch (e) { return res.status(500).json({ message: e.message }); }
};

// DELETE /api/notifications/purge-read
export const purgeRead = async (req, res) => {
  try {
    const result = await notificationService.purgeRead(req.user._id);
    return res.json({ message: `${result.deletedCount} read notifications cleared`, ...result });
  } catch (e) { return res.status(500).json({ message: e.message }); }
};

// POST /api/notifications/send (admin only — manual broadcast)
export const adminSend = async (req, res) => {
  try {
    const { recipientIds, type, title, body, actionUrl } = req.body;
    if (!recipientIds?.length || !type || !title || !body) {
      return res.status(400).json({ message: 'recipientIds, type, title and body are required' });
    }
    await notificationService.broadcastNotification(recipientIds, { type, title, body, actionUrl });
    return res.status(201).json({ message: `Notification sent to ${recipientIds.length} user(s)` });
  } catch (e) { return res.status(500).json({ message: e.message }); }
};
