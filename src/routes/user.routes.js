import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import Follow from '../models/Follow.js';
import Profile from '../models/Profile.js';

const r = Router();

r.get('/:userId/follow/status', requireAuth, async (req, res, next) => {
  try {
    const followerId = req.user.sub;
    const followingId = req.params.userId;

    const follow = await Follow.findOne({
      follower_id: followerId,
      following_id: followingId
    });

    res.json({ isFollowing: !!follow });
  } catch (e) { 
    console.error('Error checking follow status:', e);
    next(e); 
  }
});

r.post('/:userId/follow', requireAuth, async (req, res, next) => {
  try {
    const followerId = req.user.sub;
    const followingId = req.params.userId;

    if (followerId === followingId) {
      return res.status(400).json({ error: 'No puedes seguirte a ti mismo' });
    }

    const existingFollow = await Follow.findOne({
      follower_id: followerId,
      following_id: followingId
    });

    if (existingFollow) {
      return res.json({ success: true, message: 'Ya sigues a este usuario' });
    }

    await Follow.create({
      follower_id: followerId,
      following_id: followingId
    });

    await Profile.findByIdAndUpdate(followingId, { $inc: { followers_count: 1 } });
    await Profile.findByIdAndUpdate(followerId, { $inc: { following_count: 1 } });

    res.json({ success: true });
  } catch (e) { 
    console.error('Error following user:', e);
    next(e); 
  }
});

r.delete('/:userId/follow', requireAuth, async (req, res, next) => {
  try {
    const followerId = req.user.sub;
    const followingId = req.params.userId;

    const result = await Follow.deleteOne({
      follower_id: followerId,
      following_id: followingId
    });

    if (result.deletedCount > 0) {
      await Profile.findByIdAndUpdate(followingId, { $inc: { followers_count: -1 } });
      await Profile.findByIdAndUpdate(followerId, { $inc: { following_count: -1 } });
    }

    res.json({ success: true });
  } catch (e) { 
    console.error('Error unfollowing user:', e);
    next(e); 
  }
});

export default r;
