import mongoose from 'mongoose';

const PrivacySettings = new mongoose.Schema({
    is_private: { type: Boolean, default: false },
    allow_comments: { type: Boolean, default: true },
}, { _id: false });

const ImageSchema = new mongoose.Schema({
    user_id: { type: mongoose.Types.ObjectId, ref: 'Profile', index: true, required: true },
    image_url: { type: String, required: true },
    description: { type: String, maxlength: 2200 },
    hashtags: [{ type: mongoose.Types.ObjectId, ref: 'Hashtag', index: true }],
    privacy: { type: PrivacySettings, default: () => ({}) },
    likes_count: { type: Number, default: 0 },
    comments_count: { type: Number, default: 0 },
    created_at: { type: Date, default: Date.now },
}, { versionKey: false });

ImageSchema.index({ created_at: -1 });
ImageSchema.index({ description: 'text' });

export default mongoose.model('Image', ImageSchema);