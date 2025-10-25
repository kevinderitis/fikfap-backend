import mongoose from 'mongoose';
const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true, index: true, required: true },
  passwordHash: { type: String, required: true },
  providers: [{ provider: String, providerId: String }],
  createdAt: { type: Date, default: Date.now }
},{ versionKey: false });
export default mongoose.model('User', UserSchema);
