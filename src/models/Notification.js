import mongoose from 'mongoose';
const NotificationSchema = new mongoose.Schema({
  user_id: { type: mongoose.Types.ObjectId, ref: 'Profile', index: true },
  actor_id: { type: mongoose.Types.ObjectId, ref: 'Profile', index: true },
  type: { type: String, enum: ['like','comment','follow','mention','reply','message'] },
  video_id: { type: mongoose.Types.ObjectId, ref: 'Video', default: null },
  comment_id: { type: mongoose.Types.ObjectId, ref: 'Comment', default: null },
  message_id: { type: mongoose.Types.ObjectId, ref: 'Message', default: null },
  is_read: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now }
},{ versionKey: false });
NotificationSchema.index({ user_id: 1, created_at: -1 });
export default mongoose.model('Notification', NotificationSchema);
