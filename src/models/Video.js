import mongoose from 'mongoose';

const PrivacySettings = new mongoose.Schema({
  is_private: { type: Boolean, default: false },
  allow_comments: { type: Boolean, default: true },
  allow_duet: { type: Boolean, default: true },
  allow_stitch: { type: Boolean, default: true },
}, { _id: false });

const VideoSchema = new mongoose.Schema({
  user_id: { 
    type: mongoose.Types.ObjectId, 
    ref: 'Profile', 
    index: true, 
    required: true 
  },

  // ---- STREAM INFO ----
  stream_uid: { type: String, index: true }, // UID de Cloudflare Stream
  status: { 
    type: String, 
    enum: ['pending', 'ready', 'error', 'processing'], 
    default: 'pending' 
  },
  video_url: { type: String, default: null }, // https://videodelivery.net/<uid>/manifest/video.m3u8
  player_url: { type: String, default: null }, // https://iframe.videodelivery.net/<uid>
  thumbnail_url: { type: String, default: null },

  // ---- METADATA ----
  description: { type: String, maxlength: 2200 },
  hashtags: [{ type: mongoose.Types.ObjectId, ref: 'Hashtag', index: true }],
  duration: { type: Number, default: 0 },
  width: { type: Number, default: 0 },
  height: { type: Number, default: 0 },
  aspect_ratio: { type: String, default: null },

  // ---- COUNTERS ----
  views_count: { type: Number, default: 0 },
  likes_count: { type: Number, default: 0 },
  comments_count: { type: Number, default: 0 },
  shares_count: { type: Number, default: 0 },
  bookmarks_count: { type: Number, default: 0 },

  // ---- PRIVACY SETTINGS ----
  privacy: { type: PrivacySettings, default: () => ({}) },

  // ---- MODERATION / FLAGS ----
  is_deleted: { type: Boolean, default: false },
  is_reported: { type: Boolean, default: false },
  report_reason: { type: String, default: null },

  // ---- TIMESTAMPS ----
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, { 
  versionKey: false,
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// ---- INDEXES ----
VideoSchema.index({ created_at: -1 });
VideoSchema.index({ user_id: 1 });
VideoSchema.index({ stream_uid: 1 });
VideoSchema.index({ description: 'text' });

export default mongoose.model('Video', VideoSchema);