import mongoose from 'mongoose';
const BookmarkSchema = new mongoose.Schema({
  user_id: { type: mongoose.Types.ObjectId, ref: 'Profile', index: true },
  video_id: { type: mongoose.Types.ObjectId, ref: 'Video', index: true },
  created_at: { type: Date, default: Date.now }
},{ versionKey: false });
BookmarkSchema.index({ user_id: 1, video_id: 1 }, { unique: true });
export default mongoose.model('Bookmark', BookmarkSchema);
