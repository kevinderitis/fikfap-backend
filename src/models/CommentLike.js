import mongoose from 'mongoose';
const CommentLikeSchema = new mongoose.Schema({
  comment_id: { type: mongoose.Types.ObjectId, ref: 'Comment', index: true },
  user_id: { type: mongoose.Types.ObjectId, ref: 'Profile', index: true },
  created_at: { type: Date, default: Date.now }
},{ versionKey: false });
CommentLikeSchema.index({ user_id: 1, comment_id: 1 }, { unique: true });
export default mongoose.model('CommentLike', CommentLikeSchema);
