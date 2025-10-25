import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';

const r = Router();

r.get('/conversations', requireAuth, async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const convs = await Conversation.find({ participants: req.user.sub }).sort({ updated_at: -1 }).limit(limit);
    res.json({ conversations: convs, nextPage: null });
  } catch (e) { next(e); }
});

r.get('/conversations/:id', requireAuth, async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const messages = await Message.find({ conversation_id: req.params.id }).sort({ created_at: -1 }).limit(limit);
    const conv = await Conversation.findById(req.params.id);
    res.json({ messages, conversation: conv, participants: conv?.participants || [], nextPage: null });
  } catch (e) { next(e); }
});

r.post('/conversations', requireAuth, async (req, res, next) => {
  try {
    const { participantIds=[] } = req.body;
    const ids = Array.from(new Set([req.user.sub, ...participantIds]));
    const conv = await Conversation.create({ participants: ids });
    res.json({ conversation: conv });
  } catch (e) { next(e); }
});

r.post('/conversations/:id/messages', requireAuth, async (req, res, next) => {
  try {
    const { text=null, videoId=null, imageUrl=null } = req.body;
    const msg = await Message.create({ conversation_id: req.params.id, sender_id: req.user.sub, message_text: text, video_id: videoId, image_url: imageUrl });
    await Conversation.updateOne({ _id: req.params.id }, { $set: { updated_at: new Date() } });
    res.json({ message: msg });
  } catch (e) { next(e); }
});

r.put('/conversations/:id/read', requireAuth, async (req, res, next) => {
  try {
    await Message.updateMany({ conversation_id: req.params.id, sender_id: { $ne: req.user.sub } }, { $set: { is_read: true } });
    res.json({ success: true });
  } catch (e) { next(e); }
});

r.delete('/messages/:id', requireAuth, async (req, res, next) => {
  try {
    await Message.deleteOne({ _id: req.params.id, sender_id: req.user.sub });
    res.json({ success: true });
  } catch (e) { next(e); }
});

export default r;
