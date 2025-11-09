import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import Video from '../models/Video.js';
import Hashtag from '../models/Hashtag.js';
import { sanitizeText, extractMentionsAndHashtags } from '../utils/sanitize.js';

const r = Router();

r.post('/upload', requireAuth, async (req, res, next) => {
  try {
    const { description = '', hashtags = [], privacy_settings = {}, video_url, stream_uid } = req.body;
    console.log('Video upload', { user: req.user.sub, video_url, stream_uid });
    const sDesc = sanitizeText(description);
    const tagDocs = [];
    for (const t of hashtags) {
      const name = String(t).toLowerCase();
      let doc = await Hashtag.findOneAndUpdate({ name }, { $setOnInsert: { name } }, { new: true, upsert: true });
      tagDocs.push(doc._id);
    }
    const v = await Video.create({
      user_id: req.user.sub, video_url, stream_uid, description: sDesc, hashtags: tagDocs, privacy: {
        is_private: !!privacy_settings?.is_private,
        allow_comments: privacy_settings?.allow_comments ?? true,
        allow_duet: privacy_settings?.allow_duet ?? true,
        allow_stitch: privacy_settings?.allow_stitch ?? true
      }
    });
    res.json({ video: v });
  } catch (e) { next(e); }
});

r.get('/following', requireAuth, async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const userId = req.user.sub;

    // Importar el modelo Follow (añade esto al inicio del archivo si no existe)
    // import Follow from '../models/Follow.js';
    const Follow = (await import('../models/Follow.js')).default;

    // Obtener IDs de usuarios que sigue
    const follows = await Follow.find({ follower_id: userId }).select('following_id');
    const followingIds = follows.map(f => f.following_id);

    // Si no sigue a nadie, retornar array vacío
    if (followingIds.length === 0) {
      return res.json({ videos: [], nextCursor: null });
    }

    // Obtener videos de usuarios seguidos
    const videos = await Video.find({
      user_id: { $in: followingIds },
      'privacy.is_private': false
    })
      .sort({ created_at: -1 })
      .limit(limit);

    res.json({ videos, nextCursor: null });
  } catch (e) { next(e); }
});

r.get('/feed', async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const videos = await Video.find({ 'privacy.is_private': false }).sort({ created_at: -1 }).limit(limit);
    res.json({ videos, nextCursor: null });
  } catch (e) { next(e); }
});

// r.get('/feed', async (req, res, next) => {
//   try {
//     const limit = Math.min(Number(req.query.limit) || 20, 50);

//     const videos = await Video.find({ 'privacy.is_private': false })
//       .sort({ created_at: -1 })
//       .limit(limit)
//       .populate({
//         path: 'user_id',
//         select: 'username full_name avatar_url is_verified', // campos que querés traer del perfil
//       })
//       .lean();

//     res.json({ videos, nextCursor: null });
//   } catch (e) {
//     console.error('[FEED] error:', e);
//     next(e);
//   }
// });

r.get('/for-you', async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const videos = await Video.find({ 'privacy.is_private': false }).sort({ created_at: -1 }).limit(limit);
    res.json({ videos, nextCursor: null });
  } catch (e) { next(e); }
});

// r.get('/for-you', async (req, res, next) => {
//   try {
//     const limit = Math.min(Number(req.query.limit) || 20, 50);

//     const videos = await Video.find({ 'privacy.is_private': false })
//       .sort({ created_at: -1 })
//       .limit(limit)
//       .populate({
//         path: 'user_id',
//         select: 'username full_name avatar_url is_verified', // campos que querés traer del perfil
//       })
//       .lean(); // opcional, hace el resultado más liviano y rápido

//     res.json({ videos, nextCursor: null });
//   } catch (e) {
//     console.error('[FEED] error:', e);
//     next(e);
//   }
// });

r.get('/trending', async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const videos = await Video.find({ 'privacy.is_private': false }).sort({ likes_count: -1, views_count: -1, shares_count: -1 }).limit(limit);
    res.json({ videos, nextPage: null });
  } catch (e) { next(e); }
});

r.get('/hashtag/:hashtag', async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const name = req.params.hashtag.toLowerCase();
    const videos = await Video.find({ 'privacy.is_private': false }).where('description').regex(new RegExp(`#${name}`, 'i')).limit(limit);
    res.json({ videos, hashtag: name, nextPage: null });
  } catch (e) { next(e); }
});

r.get('/:id', async (req, res, next) => {
  try {
    const v = await Video.findById(req.params.id);
    if (!v) return res.status(404).json({ error: 'Not found' });
    res.json({ video: v, isLiked: false, isBookmarked: false, author: v.user_id });
  } catch (e) { next(e); }
});

r.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    await Video.deleteOne({ _id: req.params.id, user_id: req.user.sub });
    res.json({ success: true });
  } catch (e) { next(e); }
});

export default r;
