import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import Video from '../models/Video.js';
import Like from '../models/Like.js';
import Follow from '../models/Follow.js';
import Hashtag from '../models/Hashtag.js';
import { sanitizeText, extractMentionsAndHashtags } from '../utils/sanitize.js';

const r = Router();

r.post('/upload', requireAuth, async (req, res, next) => {
  try {
    const {
      description = '',
      privacy_settings = {},
      video_url,
      stream_uid
    } = req.body;

    console.log('Video upload', { user: req.user.sub, video_url, stream_uid });

    const sDesc = sanitizeText(description);

    const rawTags = sDesc.match(/#([a-zA-Z0-9_]+)/g) || [];
    const tagNames = rawTags.map(tag => tag.slice(1).toLowerCase());

    console.log('[VIDEO UPLOAD] extracted tags:', tagNames);

    const tagDocs = [];
    for (const name of tagNames) {
      const doc = await Hashtag.findOneAndUpdate(
        { name },
        { $setOnInsert: { name } },
        { new: true, upsert: true }
      );
      tagDocs.push(doc._id);
    }

    const v = await Video.create({
      user_id: req.user.sub,
      video_url,
      stream_uid,
      description: sDesc,
      hashtags: tagDocs,
      privacy: {
        is_private: !!privacy_settings?.is_private,
        allow_comments: privacy_settings?.allow_comments ?? true,
        allow_duet: privacy_settings?.allow_duet ?? true,
        allow_stitch: privacy_settings?.allow_stitch ?? true
      }
    });

    res.json({ video: v });

  } catch (e) {
    console.error('[VIDEO UPLOAD ERROR]', e);
    next(e);
  }
});

r.get('/following', requireAuth, async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const currentUserId = req.user.sub;

    const follows = await Follow.find({ follower_id: currentUserId })
      .select('following_id')
      .lean();

    const followingIds = follows.map(f => f.following_id);

    if (!followingIds.length) {
      return res.json({ videos: [], nextCursor: null });
    }

    let videos = await Video.find({
      user_id: { $in: followingIds },
      'privacy.is_private': false
    })
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

    const videoIds = videos.map(v => v._id);
    const authorIds = videos
      .map(v => v.user_id?._id)
      .filter(Boolean);

    let likedSet = new Set();
    let followingSet = new Set();

    const [likes, followsAgain] = await Promise.all([
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
    followingSet = new Set(followsAgain.map(f => f.following_id.toString()));

    const enriched = videos.map(v => {
      const author = v.user_id || null;
      const videoIdStr = v._id.toString();
      const authorIdStr = author?._id?.toString();

      return {
        ...v,
        author,
        user_id: undefined,
        isLiked: likedSet.has(videoIdStr),
        isFollowingAuthor: authorIdStr ? followingSet.has(authorIdStr) : false,
      };
    });

    res.json({
      videos: enriched,
      nextCursor: null,
    });
  } catch (e) {
    console.error('[FOLLOWING FEED] error:', e);
    next(e);
  }
});

r.get('/feed', async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const currentUserId = req.user?.sub || null;

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

    const enriched = videos.map(v => {
      const author = v.user_id || null;
      const videoIdStr = v._id.toString();
      const authorIdStr = author?._id?.toString();

      return {
        ...v,
        author,
        user_id: undefined,
        isLiked: likedSet.has(videoIdStr),
        isFollowingAuthor: authorIdStr ? followingSet.has(authorIdStr) : false,
      };
    });

    res.json({
      videos: enriched,
      nextCursor: null,
    });
  } catch (e) {
    console.error('[FEED] error:', e);
    next(e);
  }
});

r.get('/for-you', requireAuth, async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 50);

    // 👇 asumimos que req.user.sub es el _id del Profile logueado
    const currentProfileId = req.user?.sub || null;

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


    const streamUids = videos
      .map(v => v.stream_uid)
      .filter(Boolean);

    const authorIds = videos
      .map(v => v.user_id?._id || v.user_id)
      .filter(Boolean);

    let likedSet = new Set();
    let followingSet = new Set();

    if (currentProfileId) {
      const [likes, follows] = await Promise.all([
        Like.find({
          user_id: currentProfileId,
          video_id: { $in: streamUids },
        })
          .select('video_id')
          .lean(),
        Follow.find({
          follower_id: currentProfileId,
          following_id: { $in: authorIds },
        })
          .select('following_id')
          .lean(),
      ]);

      likedSet = new Set(likes.map(l => l.video_id));
      followingSet = new Set(follows.map(f => f.following_id.toString()));
    }

    const enriched = videos.map(v => {
      const author = v.user_id || null;
      const streamUid = v.stream_uid || null;
      const authorIdStr = author?._id?.toString();

      return {
        ...v,
        author,
        user_id: undefined,
        isLiked: streamUid ? likedSet.has(streamUid) : false,
        isFollowingAuthor: authorIdStr ? followingSet.has(authorIdStr) : false,
      };
    });

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
