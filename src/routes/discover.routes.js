import { Router } from 'express';
import Hashtag from '../models/Hashtag.js';
import Profile from '../models/Profile.js';
import Video from '../models/Video.js';

const r = Router();

r.get('/trending-hashtags', async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const tags = await Hashtag.find().sort({ views_count: -1, videos_count: -1 }).limit(limit);
    res.json({ hashtags: tags });
  } catch (e) { next(e); }
});

r.get('/suggested-users', async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const users = await Profile.find().sort({ followers_count: -1 }).limit(limit);
    res.json({ users });
  } catch (e) { next(e); }
});

r.get('/search', async (req, res, next) => {
  try {
    const { q='', type='videos' } = req.query;
    const regex = new RegExp(q, 'i');
    if (type === 'users') {
      const results = await Profile.find({ $or: [{ username: regex }, { full_name: regex }] }).limit(50);
      return res.json({ results, nextPage: null });
    } else if (type === 'hashtags') {
      const results = await Hashtag.find({ name: regex }).limit(50);
      return res.json({ results, nextPage: null });
    } else {
      const results = await Video.find({ description: regex, 'privacy.is_private': false }).limit(50);
      return res.json({ results, nextPage: null });
    }
  } catch (e) { next(e); }
});

export default r;
