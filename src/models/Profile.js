import mongoose from 'mongoose';
const ProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Types.ObjectId, ref: 'User', index: true, unique: true },
  username: { type: String, unique: true, index: true, required: true },
  full_name: String,
  bio: String,
  avatar_url: String,
  cover_image_url: String,
  website: String,
  is_verified: { type: Boolean, default: false },
  followers_count: { type: Number, default: 0 },
  following_count: { type: Number, default: 0 },
  likes_count: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now }
},{ versionKey: false });
ProfileSchema.index({ username: 1 });
export default mongoose.model('Profile', ProfileSchema);
