import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import Follow from '../models/Follow.js';
import Profile from '../models/Profile.js';
import UserBlock from '../models/UserBlock.js';

const r = Router();

r.post('/users/:id/follow', requireAuth, async (req, res, next) => {
  try {
    const following_id = req.params.id;
    if (String(following_id) === String(req.user.sub)) return res.status(400).json({ error: 'Cannot follow yourself' });
    const blocked = await UserBlock.findOne({ blocker_id: following_id, blocked_id: req.user.sub });
    if (blocked) return res.status(403).json({ error: 'Blocked' });
    const pre = await Follow.findOne({ follower_id: req.user.sub, following_id });
    if (pre) return res.json({ following: true });
    await Follow.create({ follower_id: req.user.sub, following_id });
    await Profile.updateOne({ _id: following_id }, { $inc: { followers_count: 1 } });
    await Profile.updateOne({ _id: req.user.sub }, { $inc: { following_count: 1 } });
    const followersCount = (await Profile.findById(following_id))?.followers_count || 0;
    res.json({ following: true, followersCount });
  } catch (e) { next(e); }
});

r.delete('/users/:id/follow', requireAuth, async (req, res, next) => {
  try {
    const following_id = req.params.id;
    const out = await Follow.deleteOne({ follower_id: req.user.sub, following_id });
    if (out.deletedCount) {
      await Profile.updateOne({ _id: following_id }, { $inc: { followers_count: -1 } });
      await Profile.updateOne({ _id: req.user.sub }, { $inc: { following_count: -1 } });
    }
    const followersCount = (await Profile.findById(following_id))?.followers_count || 0;
    res.json({ following: false, followersCount });
  } catch (e) { next(e); }
});

r.post('/users/:id/block', requireAuth, async (req, res, next) => {
  try {
    const blocked_id = req.params.id;
    await UserBlock.updateOne({ blocker_id: req.user.sub, blocked_id }, { $setOnInsert: { blocker_id: req.user.sub, blocked_id } }, { upsert: true });
    res.json({ blocked: true });
  } catch (e) { next(e); }
});

r.delete('/users/:id/block', requireAuth, async (req, res, next) => {
  try {
    const blocked_id = req.params.id;
    await UserBlock.deleteOne({ blocker_id: req.user.sub, blocked_id });
    res.json({ blocked: false });
  } catch (e) { next(e); }
});

export default r;
