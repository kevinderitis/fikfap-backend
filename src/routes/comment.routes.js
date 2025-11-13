import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import Comment from '../models/Comment.js';
import CommentLike from '../models/CommentLike.js';
import Video from '../models/Video.js';

const r = Router();

// r.get('/videos/:id/comments', async (req, res, next) => {
//   try {
//     const { page=1, limit=20, sortBy='recent' } = req.query;
//     const sort = sortBy === 'popular' ? { likes_count: -1 } : { created_at: -1 };
//     const comments = await Comment.find({ video_id: req.params.id, parent_comment_id: null }).sort(sort).limit(Math.min(limit, 50));
//     res.json({ comments, nextPage: null });
//   } catch (e) { next(e); }
// });

r.get('/videos/:id/comments', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, sortBy = 'recent' } = req.query;

    const sort = sortBy === 'popular'
      ? { likes_count: -1 }
      : { created_at: -1 };

    const comments = await Comment.find({
      video_id: req.params.id,
      parent_comment_id: null
    })
      .sort(sort)
      .limit(Math.min(limit, 50))
      .populate('user_id', 'username avatar_url full_name is_verified');

    console.log('[COMMENTS] fetched', comments.length, 'comments for video', req.params.id);
    console.log('[COMMENTS] comments:', comments);
    res.json({ comments, nextPage: null });
  } catch (e) {
    console.error('[COMMENTS] error:', e);
    next(e);
  }
});

r.post('/videos/:id/comments', requireAuth, async (req, res, next) => {
  try {
    const { text, parentCommentId = null } = req.body;
    const c = await Comment.create({ video_id: req.params.id, user_id: req.user.sub, text, parent_comment_id: parentCommentId });
    await Video.updateOne({ stream_uid: req.params.id }, { $inc: { comments_count: 1 } });
    if (parentCommentId) await Comment.updateOne({ _id: parentCommentId }, { $inc: { replies_count: 1 } });
    res.json({ comment: c });
  } catch (e) { next(e); }
});

r.delete('/comments/:id', requireAuth, async (req, res, next) => {
  try {
    const c = await Comment.findOne({ _id: req.params.id, user_id: req.user.sub });
    if (!c) return res.status(404).json({ error: 'Not found' });
    await Comment.deleteOne({ _id: c._id });
    await Video.updateOne({ stream_uid: c.video_id }, { $inc: { comments_count: -1 } });
    if (c.parent_comment_id) await Comment.updateOne({ _id: c.parent_comment_id }, { $inc: { replies_count: -1 } });
    res.json({ success: true });
  } catch (e) { next(e); }
});

r.post('/comments/:id/like', requireAuth, async (req, res, next) => {
  try {
    const comment_id = req.params.id;
    await CommentLike.updateOne({ user_id: req.user.sub, comment_id }, { $setOnInsert: { user_id: req.user.sub, comment_id } }, { upsert: true });
    const likes = await CommentLike.countDocuments({ comment_id });
    await Comment.updateOne({ _id: comment_id }, { $set: { likes_count: likes } });
    res.json({ liked: true, likesCount: likes });
  } catch (e) { next(e); }
});

r.delete('/comments/:id/like', requireAuth, async (req, res, next) => {
  try {
    const comment_id = req.params.id;
    await CommentLike.deleteOne({ user_id: req.user.sub, comment_id });
    const likes = await CommentLike.countDocuments({ comment_id });
    await Comment.updateOne({ _id: comment_id }, { $set: { likes_count: likes } });
    res.json({ liked: false, likesCount: likes });
  } catch (e) { next(e); }
});

export default r;
