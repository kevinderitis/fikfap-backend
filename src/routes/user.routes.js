import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import Follow from '../models/Follow.js';
import Profile from '../models/Profile.js';

const r = Router();

// GET /users/:userId/follow/status - Verificar si sigues a un usuario
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

// POST /users/:userId/follow - Seguir a un usuario
r.post('/:userId/follow', requireAuth, async (req, res, next) => {
  try {
    const followerId = req.user.sub;
    const followingId = req.params.userId;

    if (followerId === followingId) {
      return res.status(400).json({ error: 'No puedes seguirte a ti mismo' });
    }

    // Verificar si ya sigue
    const existingFollow = await Follow.findOne({
      follower_id: followerId,
      following_id: followingId
    });

    if (existingFollow) {
      return res.json({ success: true, message: 'Ya sigues a este usuario' });
    }

    // Crear nuevo follow
    await Follow.create({
      follower_id: followerId,
      following_id: followingId
    });

    // Actualizar contadores
    await Profile.findByIdAndUpdate(followingId, { $inc: { followers_count: 1 } });
    await Profile.findByIdAndUpdate(followerId, { $inc: { following_count: 1 } });

    res.json({ success: true });
  } catch (e) { 
    console.error('Error following user:', e);
    next(e); 
  }
});

// DELETE /users/:userId/follow - Dejar de seguir a un usuario
r.delete('/:userId/follow', requireAuth, async (req, res, next) => {
  try {
    const followerId = req.user.sub;
    const followingId = req.params.userId;

    // Eliminar follow
    const result = await Follow.deleteOne({
      follower_id: followerId,
      following_id: followingId
    });

    if (result.deletedCount > 0) {
      // Actualizar contadores
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
