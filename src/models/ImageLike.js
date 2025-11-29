import mongoose from 'mongoose';

const ImageLikeSchema = new mongoose.Schema({
  user_id: { type: mongoose.Types.ObjectId, ref: 'Profile', index: true },
  image_id: { type: mongoose.Types.ObjectId, ref: 'Image', index: true },
  created_at: { type: Date, default: Date.now }
});

ImageLikeSchema.index({ user_id: 1, image_id: 1 }, { unique: true });

export default mongoose.model('ImageLike', ImageLikeSchema);