import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import Profile from '../models/Profile.js';
import Video from '../models/Video.js';
import Follow from '../models/Follow.js';
import UserBlock from '../models/UserBlock.js';
import mongoose from 'mongoose';

const r = Router();

r.get('/:username', async (req, res, next) => {
  try {
    const profile = await Profile.findOne({ username: req.params.username });
    if (!profile) return res.status(404).json({ error: 'Not found' });
    let isFollowing = false, isBlocked = false;
    if (req.user?.sub) {
      isFollowing = !!await Follow.findOne({ follower_id: req.user.sub, following_id: profile._id });
      isBlocked = !!await UserBlock.findOne({ blocker_id: profile._id, blocked_id: req.user.sub });
    }
    res.json({ profile, isFollowing, isBlocked });
  } catch (e) { next(e); }
});

r.get('/id/:profile_id', async (req, res, next) => {
  try {
    const { profile_id } = req.params;

    // Validar y convertir a ObjectId
    if (!mongoose.Types.ObjectId.isValid(profile_id)) {
      return res.status(400).json({ error: 'Invalid profile_id' });
    }

    const objId = new mongoose.Types.ObjectId(profile_id);
    console.log('[PROFILE] fetching by _id:', objId.toString());

    // Buscar por _id (Profile)
    const profile = await Profile.findById(objId);
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    // Determinar si el usuario actual sigue o está bloqueado
    let isFollowing = false;
    let isBlocked = false;

    if (req.user?.sub) {
      const [followDoc, blockDoc] = await Promise.all([
        Follow.findOne({
          follower_id: req.user.sub,
          following_id: profile._id,
        }),
        UserBlock.findOne({
          blocker_id: profile._id,
          blocked_id: req.user.sub,
        }),
      ]);

      isFollowing = !!followDoc;
      isBlocked = !!blockDoc;
    }

    res.json({ profile, isFollowing, isBlocked });
  } catch (e) {
    console.error('[PROFILE] error:', e);
    next(e);
  }
});

r.put('/', requireAuth, async (req, res, next) => {
  try {
    const { full_name, bio, website, avatar_url, cover_image_url } = req.body;
    const profile = await Profile.findByIdAndUpdate(req.user.sub, { full_name, bio, website, avatar_url, cover_image_url }, { new: true });
    res.json({ profile });
  } catch (e) { next(e); }
});

r.get('/:username/videos', async (req, res, next) => {
  try {
    const profile = await Profile.findOne({ username: req.params.username });
    if (!profile) return res.status(404).json({ error: 'Not found' });
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const videos = await Video.find({ user_id: profile._id }).sort({ created_at: -1 }).limit(limit);
    res.json({ videos, nextPage: null });
  } catch (e) { next(e); }
});

r.get('/:username/liked', async (req, res, next) => {
  try {
    // Placeholder simple (requiere agregación Like->Video)
    res.json({ videos: [], nextPage: null });
  } catch (e) { next(e); }
});

r.get('/:username/followers', async (req, res, next) => {
  try {
    const profile = await Profile.findOne({ username: req.params.username });
    if (!profile) return res.status(404).json({ error: 'Not found' });
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const follows = await Follow.find({ following_id: profile._id }).limit(limit);
    res.json({ users: follows.map(f => f.follower_id), nextPage: null });
  } catch (e) { next(e); }
});

r.get('/:username/following', async (req, res, next) => {
  try {
    const profile = await Profile.findOne({ username: req.params.username });
    if (!profile) return res.status(404).json({ error: 'Not found' });
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const follows = await Follow.find({ follower_id: profile._id }).limit(limit);
    res.json({ users: follows.map(f => f.following_id), nextPage: null });
  } catch (e) { next(e); }
});

export default r;
