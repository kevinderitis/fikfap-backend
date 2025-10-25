import mongoose from 'mongoose';
const MessageSchema = new mongoose.Schema({
  conversation_id: { type: mongoose.Types.ObjectId, ref: 'Conversation', index: true },
  sender_id: { type: mongoose.Types.ObjectId, ref: 'Profile', index: true },
  message_text: String,
  video_id: { type: mongoose.Types.ObjectId, ref: 'Video', default: null },
  image_url: String,
  is_read: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now }
},{ versionKey: false });
MessageSchema.index({ conversation_id: 1, created_at: -1 });
export default mongoose.model('Message', MessageSchema);
