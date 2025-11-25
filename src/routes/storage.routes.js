import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { presign } from '../services/s3.js';
import { createDirectUpload } from '../services/stream.js';

const r = Router();

r.get('/s3/presign', requireAuth, async (req, res, next) => {
  try {
    const { bucket, ext = 'jpg' } = req.query;

    if (![
      'app-avatars',
      'app-covers',
      'app-chat-media',
      'app-thumbnails',
      'app-content-media'
    ].includes(bucket)) {
      console.error('[S3 PRESIGN] ❌ Invalid bucket:', bucket);
      throw new Error('Invalid bucket');
    }

    const key = `${req.user.sub}/${Date.now()}.${ext}`;
    let url = null;

    try {
      url = await presign({
        bucket,
        key,
        contentType: `image/${ext}`
      });
    } catch (err) {
      console.error('[S3 PRESIGN] ❌ Error generating presigned URL:', {
        message: err.message,
        stack: err.stack,
        bucket,
        key,
        ext
      });
      return res.status(500).json({
        error: 'Failed to generate presigned URL',
        details: err.message
      });
    }

    res.json({
      url,
      key,
      publicUrl: `https://${process.env.CDN_DOMAIN}/${key}`
    });

  } catch (e) {
    console.error('[S3 PRESIGN] ❌ Handler error:', e);
    next(e);
  }
});

r.post('/stream/direct-upload', requireAuth, async (req, res, next) => {
  try { res.json(await createDirectUpload()); } catch (e) { next(e); }
});



export default r;
