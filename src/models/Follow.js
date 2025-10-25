import mongoose from 'mongoose';
const FollowSchema = new mongoose.Schema({
  follower_id: { type: mongoose.Types.ObjectId, ref: 'Profile', index: true },
  following_id: { type: mongoose.Types.ObjectId, ref: 'Profile', index: true },
  created_at: { type: Date, default: Date.now }
},{ versionKey: false });
FollowSchema.index({ follower_id: 1, following_id: 1 }, { unique: true });
export default mongoose.model('Follow', FollowSchema);
