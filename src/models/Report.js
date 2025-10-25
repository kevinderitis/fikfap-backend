import mongoose from 'mongoose';
const ReportSchema = new mongoose.Schema({
  reporter_id: { type: mongoose.Types.ObjectId, ref: 'Profile', index: true },
  reported_user_id: { type: mongoose.Types.ObjectId, ref: 'Profile', default: null },
  video_id: { type: mongoose.Types.ObjectId, ref: 'Video', default: null },
  comment_id: { type: mongoose.Types.ObjectId, ref: 'Comment', default: null },
  reason: { type: String, enum: ['spam','harassment','hate_speech','violence','nudity','false_info','other'] },
  description: String,
  status: { type: String, enum: ['pending','reviewed','resolved','dismissed'], default: 'pending' },
  created_at: { type: Date, default: Date.now }
},{ versionKey: false });
export default mongoose.model('Report', ReportSchema);
