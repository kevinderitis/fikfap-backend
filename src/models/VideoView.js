import mongoose from 'mongoose';
const VideoViewSchema = new mongoose.Schema({
  video_id: { type: mongoose.Types.ObjectId, ref: 'Video', index: true },
  user_id: { type: mongoose.Types.ObjectId, ref: 'Profile', default: null },
  watch_duration: Number,
  completed: Boolean,
  created_at: { type: Date, default: Date.now }
},{ versionKey: false });
VideoViewSchema.index({ video_id: 1, created_at: -1 });
export default mongoose.model('VideoView', VideoViewSchema);
