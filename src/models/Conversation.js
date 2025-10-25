import mongoose from 'mongoose';
const ConversationSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Types.ObjectId, ref: 'Profile', index: true }],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
},{ versionKey: false });
export default mongoose.model('Conversation', ConversationSchema);
