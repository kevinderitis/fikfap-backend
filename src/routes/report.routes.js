import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import Report from '../models/Report.js';

const r = Router();

r.post('/reports', requireAuth, async (req, res, next) => {
  try {
    const { type, targetId, reason, description='' } = req.body;
    const payload = { reporter_id: req.user.sub, reason, description };
    if (type === 'user') payload.reported_user_id = targetId;
    if (type === 'video') payload.video_id = targetId;
    if (type === 'comment') payload.comment_id = targetId;
    await Report.create(payload);
    res.json({ success: true });
  } catch (e) { next(e); }
});

export default r;
