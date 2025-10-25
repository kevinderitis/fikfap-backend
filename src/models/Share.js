import mongoose from 'mongoose';
const ShareSchema = new mongoose.Schema({
  video_id: { type: mongoose.Types.ObjectId, ref: 'Video', index: true },
  user_id: { type: mongoose.Types.ObjectId, ref: 'Profile', index: true },
  share_type: { type: String, enum: ['link','whatsapp','facebook','twitter','instagram'] },
  created_at: { type: Date, default: Date.now }
},{ versionKey: false });
export default mongoose.model('Share', ShareSchema);
