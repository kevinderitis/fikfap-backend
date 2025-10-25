import mongoose from 'mongoose';
const HashtagSchema = new mongoose.Schema({
  name: { type: String, unique: true, index: true, required: true },
  videos_count: { type: Number, default: 0 },
  views_count: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now }
},{ versionKey: false });
export default mongoose.model('Hashtag', HashtagSchema);
