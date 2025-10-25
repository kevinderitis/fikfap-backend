import mongoose from 'mongoose';
const LikeSchema = new mongoose.Schema({
  user_id: { type: mongoose.Types.ObjectId, ref: 'Profile', index: true, required: true },
  video_id: { type: mongoose.Types.ObjectId, ref: 'Video', index: true, required: true },
  created_at: { type: Date, default: Date.now }
},{ versionKey: false });
LikeSchema.index({ user_id: 1, video_id: 1 }, { unique: true });
export default mongoose.model('Like', LikeSchema);
