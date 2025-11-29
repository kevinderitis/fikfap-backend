import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import Image from '../models/Image.js';
import ImageLike from '../models/ImageLike.js';
import ImageComment from '../models/ImageComment.js';
import Hashtag from '../models/Hashtag.js';
import { sanitizeText } from '../utils/sanitize.js';

const r = Router();

r.post('/upload', requireAuth, async (req, res, next) => {
    try {
        const {
            image_url,
            description = '',
            privacy_settings = {}
        } = req.body;

        if (!image_url) {
            return res.status(400).json({ error: 'image_url is required' });
        }

        const sDesc = sanitizeText(description);

        const rawTags = sDesc.match(/#([a-zA-Z0-9_]+)/g) || [];
        const tagNames = rawTags.map(tag => tag.slice(1).toLowerCase());

        const tagDocs = [];
        for (const name of tagNames) {
            const doc = await Hashtag.findOneAndUpdate(
                { name },
                { $setOnInsert: { name } },
                { new: true, upsert: true }
            );
            tagDocs.push(doc._id);
        }

        const img = await Image.create({
            user_id: req.user.sub,
            image_url,
            description: sDesc,
            hashtags: tagDocs,
            privacy: {
                is_private: !!privacy_settings?.is_private,
                allow_comments: privacy_settings?.allow_comments ?? true
            }
        });

        res.json({ image: img });
    } catch (e) {
        console.error('[IMAGE UPLOAD ERROR]', e);
        next(e);
    }
});

r.get('/feed', async (req, res, next) => {
    try {
        const limit = Math.min(Number(req.query.limit) || 20, 50);

        let images = await Image.find({ 'privacy.is_private': false })
            .sort({ created_at: -1 })
            .limit(limit)
            .populate({
                path: 'user_id',
                select: 'username full_name avatar_url is_verified followers_count',
            })
            .lean();

        if (!images.length) {
            return res.json({ images: [], nextCursor: null });
        }

        const enriched = images.map(img => {
            const author = img.user_id || null;
            return {
                ...img,
                author,
                user_id: undefined,
            };
        });

        res.json({ images: enriched, nextCursor: null });
    } catch (e) {
        console.error('[IMAGE FEED ERROR]', e);
        next(e);
    }
});


r.get('/:id', async (req, res, next) => {
    try {
        const img = await Image.findById(req.params.id).populate({
            path: 'user_id',
            select: 'username full_name avatar_url is_verified followers_count',
        });

        if (!img) return res.status(404).json({ error: 'Not found' });

        res.json({
            image: img,
            author: img.user_id,
            isLiked: false,
            isBookmarked: false,
        });
    } catch (e) {
        console.error('[IMAGE GET ERROR]', e);
        next(e);
    }
});


r.delete('/:id', requireAuth, async (req, res, next) => {
    try {
        await Image.deleteOne({ _id: req.params.id, user_id: req.user.sub });
        res.json({ success: true });
    } catch (e) {
        console.error('[IMAGE DELETE ERROR]', e);
        next(e);
    }
});


r.post('/:imageId/like', requireAuth, async (req, res, next) => {
    try {
        const imageId = req.params.imageId;
        const userId = req.user.sub;

        const existing = await ImageLike.findOne({ image_id: imageId, user_id: userId });

        if (existing) {
            await ImageLike.deleteOne({ _id: existing._id });
            await Image.updateOne({ _id: imageId }, { $inc: { likes_count: -1 } });
            return res.json({ liked: false });
        }

        await ImageLike.create({ image_id: imageId, user_id: userId });
        await Image.updateOne({ _id: imageId }, { $inc: { likes_count: 1 } });

        res.json({ liked: true });

    } catch (e) {
        console.error('[IMAGE LIKE ERROR]', e);
        next(e);
    }
});



r.get('/:imageId/like', requireAuth, async (req, res, next) => {
    try {
        const liked = !!await ImageLike.findOne({
            image_id: req.params.imageId,
            user_id: req.user.sub
        });

        res.json({ liked });

    } catch (e) {
        console.error('[IMAGE CHECK LIKE ERROR]', e);
        next(e);
    }
});


r.get('/:imageId/comments', async (req, res, next) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const skip = (page - 1) * limit;

        const comments = await ImageComment.find({ image_id: req.params.imageId })
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(Math.min(limit, 50))
            .populate({
                path: 'user_id',
                select: 'username avatar_url full_name'
            })
            .lean();

        res.json({ comments });

    } catch (e) {
        console.error('[IMAGE COMMENTS ERROR]', e);
        next(e);
    }
});


r.post('/:imageId/comments', requireAuth, async (req, res, next) => {
    try {
        const { text } = req.body;
        if (!text?.trim()) return res.status(400).json({ error: 'Text required' });

        const comment = await ImageComment.create({
            image_id: req.params.imageId,
            user_id: req.user.sub,
            text,
        });

        await Image.updateOne(
            { _id: req.params.imageId },
            { $inc: { comments_count: 1 } }
        );

        const populated = await comment.populate('user_id', 'username avatar_url full_name');

        res.json({ comment: populated });

    } catch (e) {
        console.error('[IMAGE COMMENT CREATE ERROR]', e);
        next(e);
    }
});

export default r;