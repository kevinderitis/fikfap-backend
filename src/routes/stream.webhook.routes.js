import { Router } from 'express';
import express from 'express';
import { verifyStreamSignature } from '../utils/verifyStreamSignature.js';
// import Video from '../models/Video.js'; // si ya lo tenés

const r = Router();

// Ruta EXACTA: POST /_internal/webhooks/stream
r.post('/webhooks/stream', express.raw({ type: 'application/json' }), async (req, res) => {
    try {
        // guardamos el raw body para el verificador
        req.rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body || '');

        // validar firma
        // if (!verifyStreamSignature(req)) {
        //   console.log('[STREAM] invalid signature');
        //   return res.status(401).json({ ok: false });
        // }

        // parsear JSON del raw body
        let payload = {};
        try { payload = JSON.parse(req.rawBody.toString('utf8') || '{}'); } catch { }

        const uid = payload?.uid || payload?.video?.uid;
        const state = payload?.status?.state || payload?.event || 'unknown';
        const duration = payload?.duration || payload?.meta?.duration;
        // const hls = payload?.playback?.hls || (uid ? `https://videodelivery.net/${uid}/manifest/video.m3u8` : null);

        console.log('[STREAM] webhook:', { uid, state, duration });

        // Actualizá tu video si corresponde
        await Video.findOneAndUpdate(
            { stream_uid: uid },
            {
                $set: {
                    status: 'ready',
                    player_url: `https://iframe.videodelivery.net/${uid}`,
                    thumbnail_url: `https://videodelivery.net/${uid}/thumbnails/thumbnail.jpg`,
                    video_url: `https://videodelivery.net/${uid}/manifest/video.m3u8`, // opcional
                    duration: payload.duration || 0
                }
            },
            { new: true }
        );

        return res.status(200).json({ ok: true });
    } catch (e) {
        console.error('[STREAM] webhook error:', e);
        return res.status(500).json({ ok: false });
    }
});

export default r;