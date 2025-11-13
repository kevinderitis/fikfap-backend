import mongoose from 'mongoose';
const CommentSchema = new mongoose.Schema({
  video_id: { type: String },
  user_id: { type: mongoose.Types.ObjectId, ref: 'Profile', index: true },
  parent_comment_id: { type: mongoose.Types.ObjectId, ref: 'Comment', default: null },
  text: { type: String, maxlength: 1000 },
  likes_count: { type: Number, default: 0 },
  replies_count: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now }
},{ versionKey: false });
CommentSchema.index({ video_id: 1, created_at: -1 });
export default mongoose.model('Comment', CommentSchema);
