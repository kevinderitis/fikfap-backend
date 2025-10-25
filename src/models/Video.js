import mongoose from 'mongoose';
const PrivacySettings = new mongoose.Schema({
  is_private: { type: Boolean, default: false },
  allow_comments: { type: Boolean, default: true },
  allow_duet: { type: Boolean, default: true },
  allow_stitch: { type: Boolean, default: true },
}, { _id: false });

const VideoSchema = new mongoose.Schema({
  user_id: { type: mongoose.Types.ObjectId, ref: 'Profile', index: true, required: true },
  video_url: { type: String, default: null },
  streamId: { type: String, index: true },
  thumbnail_url: String,
  description: { type: String, maxlength: 2200 },
  hashtags: [{ type: mongoose.Types.ObjectId, ref: 'Hashtag', index: true }],
  duration: Number,
  views_count: { type: Number, default: 0 },
  likes_count: { type: Number, default: 0 },
  comments_count: { type: Number, default: 0 },
  shares_count: { type: Number, default: 0 },
  privacy: { type: PrivacySettings, default: () => ({}) },
  created_at: { type: Date, default: Date.now }
}, { versionKey: false });

VideoSchema.index({ created_at: -1 });
VideoSchema.index({ description: 'text' });
export default mongoose.model('Video', VideoSchema);
