import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import Like from '../models/Like.js';
import Bookmark from '../models/Bookmark.js';
import Share from '../models/Share.js';
import Video from '../models/Video.js';
import VideoView from '../models/VideoView.js';

const r = Router({ mergeParams: true });

r.post('/:id/like', requireAuth, async (req, res, next) => {
  try {
    const stream_uid = req.params.id;
    const liked = await Like.findOne({ user_id: req.user.sub, stream_uid });
    if (liked) return res.json({ liked: true });
    await Like.create({ user_id: req.user.sub, video_id });
    await Video.updateOne({ stream_uid }, { $inc: { likes_count: 1 } });
    const v = await Video.findOne({ stream_uid });
    res.json({ liked: true, likesCount: v?.likes_count || 0 });
  } catch (e) { next(e); }
});

r.delete('/:id/like', requireAuth, async (req, res, next) => {
  try {
    const stream_uid = req.params.id;
    const out = await Like.deleteOne({ user_id: req.user.sub, stream_uid });
    if (out.deletedCount) await Video.updateOne({ stream_uid }, { $inc: { likes_count: -1 } });
    const v = await Video.findOne({ stream_uid });
    res.json({ liked: false, likesCount: v?.likes_count || 0 });
  } catch (e) { next(e); }
});

r.post('/:id/bookmark', requireAuth, async (req, res, next) => {
  try {
    const stream_uid = req.params.id;
    await Bookmark.updateOne({ user_id: req.user.sub, stream_uid }, { $setOnInsert: { user_id: req.user.sub, video_id } }, { upsert: true });
    res.json({ bookmarked: true });
  } catch (e) { next(e); }
});

r.delete('/:id/bookmark', requireAuth, async (req, res, next) => {
  try {
    await Bookmark.deleteOne({ user_id: req.user.sub, stream_uid: req.params.id });
    res.json({ bookmarked: false });
  } catch (e) { next(e); }
});

r.post('/:id/share', requireAuth, async (req, res, next) => {
  try {
    const { shareType } = req.body;
    await Share.create({ user_id: req.user.sub, stream_uid: req.params.id, share_type: shareType });
    const v = await Video.findByIdAndUpdate(req.params.id, { $inc: { shares_count: 1 } }, { new: true });
    res.json({ success: true, sharesCount: v?.shares_count || 0 });
  } catch (e) { next(e); }
});

r.post('/:id/view', async (req, res, next) => {
  try {
    const { watchDuration = 0, completed = false } = req.body || {};
    await VideoView.create({ stream_uid: req.params.id, user_id: req.user?.sub || null, watch_duration: watchDuration, completed });
    const v = await Video.findByIdAndUpdate(req.params.id, { $inc: { views_count: 1 } }, { new: true });
    res.json({ success: true, viewsCount: v?.views_count || 0 });
  } catch (e) { next(e); }
});

export default r;
