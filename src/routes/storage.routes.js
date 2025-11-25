import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { presign } from '../services/s3.js';
import { createDirectUpload } from '../services/stream.js';

const r = Router();

r.get('/s3/presign', requireAuth, async (req, res, next) => {
  try {
    const { bucket, ext = 'jpg' } = req.query;
    if (!['app-avatars', 'app-covers', 'app-chat-media', 'app-thumbnails', 'app-content-media'].includes(bucket)) throw new Error('Invalid bucket');
    const key = `${req.user.sub}/${Date.now()}.${ext}`;
    const url = await presign({ bucket, key, contentType: `image/${ext}` });
    res.json({ url, key, publicUrl: `https://${process.env.CDN_DOMAIN}/${key}` });
  } catch (e) { next(e); }
});

r.post('/stream/direct-upload', requireAuth, async (req, res, next) => {
  try { res.json(await createDirectUpload()); } catch (e) { next(e); }
});



export default r;
