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

// r.get('/feed', async (req, res, next) => {
//   try {
//     const limit = Math.min(Number(req.query.limit) || 20, 50);
//     const videos = await Video.find({ 'privacy.is_private': false }).sort({ created_at: -1 }).limit(limit);
//     res.json({ videos, nextCursor: null });
//   } catch (e) { next(e); }
// });


r.get('/feed', async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const currentUserId = req.user?.sub || null; // Profile._id del logueado (si lo tenés así)

    // 1) Traemos los videos públicos + info básica del autor
    let videos = await Video.find({ 'privacy.is_private': false })
      .sort({ created_at: -1 })
      .limit(limit)
      .populate({
        path: 'user_id',
        select: 'username full_name avatar_url is_verified followers_count',
      })
      .lean(); // objetos planos, no documentos Mongoose

    if (!videos.length) {
      return res.json({ videos: [], nextCursor: null });
    }

    // 2) Armar listas de ids para consultas masivas
    const videoIds = videos.map(v => v._id);
    const authorIds = videos
      .map(v => v.user_id?._id)
      .filter(Boolean);

    let likedSet = new Set();
    let followingSet = new Set();

    if (currentUserId) {
      // 3) Buscar likes del usuario en TODOS esos videos
      const [likes, follows] = await Promise.all([
        Like.find({
          user_id: currentUserId,
          video_id: { $in: videoIds },
        }).select('video_id').lean(),
        Follow.find({
          follower_id: currentUserId,
          following_id: { $in: authorIds },
        }).select('following_id').lean(),
      ]);

      likedSet = new Set(likes.map(l => l.video_id.toString()));
      followingSet = new Set(follows.map(f => f.following_id.toString()));
    }

    // 4) Enriquecer cada video con flags + renombrar autor
    const enriched = videos.map(v => {
      const author = v.user_id || null;
      const videoIdStr = v._id.toString();
      const authorIdStr = author?._id?.toString();

      return {
        ...v,
        author,                 // objeto Profile
        user_id: undefined,     // para no exponer el nombre original si no querés
        isLiked: likedSet.has(videoIdStr),
        isFollowingAuthor: authorIdStr ? followingSet.has(authorIdStr) : false,
      };
    });

    console.log('[FEED] returning', enriched.length, 'videos for user', currentUserId);
    console.log('[FEED] video IDs:', enriched.map(v => v._id.toString()).join(', '));
    console.log('[FEED] videos', enriched);
    res.json({
      videos: enriched,
      nextCursor: null, // después lo podés cambiar a paginación con cursor
    });
  } catch (e) {
    console.error('[FEED] error:', e);
    next(e);
  }
});

// r.get('/for-you', async (req, res, next) => {
//   try {
//     const limit = Math.min(Number(req.query.limit) || 20, 50);
//     const videos = await Video.find({ 'privacy.is_private': false }).sort({ created_at: -1 }).limit(limit);
//     res.json({ videos, nextCursor: null });
//   } catch (e) { next(e); }
// });

r.get('/for-you', async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 50);

    // 👇 asumimos que req.user.sub es el _id del Profile logueado
    const currentProfileId = req.user?.sub || null;

    // 1) Videos públicos + autor (Profile)
    let videos = await Video.find({ 'privacy.is_private': false })
      .sort({ created_at: -1 })
      .limit(limit)
      .populate({
        path: 'user_id',
        select: 'username full_name avatar_url is_verified followers_count',
      })
      .lean();

    if (!videos.length) {
      return res.json({ videos: [], nextCursor: null });
    }

    // 2) Sacar stream_uids y authorIds
    const streamUids = videos
      .map(v => v.stream_uid)   // 👈 campo real
      .filter(Boolean);

    const authorIds = videos
      .map(v => v.user_id?._id || v.user_id) // soporta populate o no
      .filter(Boolean);

    let likedSet = new Set();
    let followingSet = new Set();

    if (currentProfileId) {
      // 3) Likes del profile logueado sobre esos stream_uids
      //    y follows del profile logueado hacia esos autores
      const [likes, follows] = await Promise.all([
        Like.find({
          user_id: currentProfileId,      // 👈 Profile._id
          video_id: { $in: streamUids }, // 👈 stream_uid
        })
          .select('video_id')
          .lean(),
        Follow.find({
          follower_id: currentProfileId,  // 👈 Profile._id
          following_id: { $in: authorIds },
        })
          .select('following_id')
          .lean(),
      ]);

      likedSet = new Set(likes.map(l => l.video_id));                 // set de stream_uids
      followingSet = new Set(follows.map(f => f.following_id.toString())); // set de Profile._id (string)
    }

    // 4) Enriquecer cada video con author + flags
    const enriched = videos.map(v => {
      const author = v.user_id || null;
      const streamUid = v.stream_uid || null;
      const authorIdStr = author?._id?.toString();

      return {
        ...v,
        author,                 // perfil del creador
        user_id: undefined,     // opcional: ocultar el campo original si no lo querés exponer
        isLiked: streamUid ? likedSet.has(streamUid) : false,
        isFollowingAuthor: authorIdStr ? followingSet.has(authorIdStr) : false,
      };
    });
    
    console.log('[FOR-YOU] returning', enriched.length, 'videos for user', currentProfileId);
    console.log('[FOR-YOU] video IDs:', enriched.map(v => v._id.toString()).join(', '));
    console.log('[FOR-YOU] videos', enriched);

    res.json({
      videos: enriched,
      nextCursor: null,
    });
  } catch (e) {
    console.error('[FEED] error:', e);
    next(e);
  }
});


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
