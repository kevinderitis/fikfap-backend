import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import Notification from '../models/Notification.js';

const r = Router();

r.get('/notifications', requireAuth, async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const type = req.query.type;
    const q = { user_id: req.user.sub };
    if (type) q.type = type;
    const notifs = await Notification.find(q).sort({ created_at: -1 }).limit(limit);
    const unreadCount = await Notification.countDocuments({ user_id: req.user.sub, is_read: false });
    res.json({ notifications: notifs, unreadCount, nextPage: null });
  } catch (e) { next(e); }
});

r.put('/notifications/read', requireAuth, async (req, res, next) => {
  try {
    const { notificationIds=[] } = req.body;
    await Notification.updateMany({ _id: { $in: notificationIds }, user_id: req.user.sub }, { $set: { is_read: true } });
    res.json({ success: true });
  } catch (e) { next(e); }
});

r.put('/notifications/read-all', requireAuth, async (req, res, next) => {
  try {
    await Notification.updateMany({ user_id: req.user.sub }, { $set: { is_read: true } });
    res.json({ success: true });
  } catch (e) { next(e); }
});

r.get('/notifications/unread-count', requireAuth, async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({ user_id: req.user.sub, is_read: false });
    res.json({ count });
  } catch (e) { next(e); }
});

export default r;
