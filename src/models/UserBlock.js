import mongoose from 'mongoose';
const UserBlockSchema = new mongoose.Schema({
  blocker_id: { type: mongoose.Types.ObjectId, ref: 'Profile', index: true },
  blocked_id: { type: mongoose.Types.ObjectId, ref: 'Profile', index: true },
  created_at: { type: Date, default: Date.now }
},{ versionKey: false });
UserBlockSchema.index({ blocker_id: 1, blocked_id: 1 }, { unique: true });
export default mongoose.model('UserBlock', UserBlockSchema);
