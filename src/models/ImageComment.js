import mongoose from 'mongoose';

const ImageCommentSchema = new mongoose.Schema({
  image_id: { type: mongoose.Types.ObjectId, ref: 'Image', index: true },
  user_id: { type: mongoose.Types.ObjectId, ref: 'Profile', index: true },
  text: String,
  created_at: { type: Date, default: Date.now }
}, { versionKey: false });

export default mongoose.model('ImageComment', ImageCommentSchema);