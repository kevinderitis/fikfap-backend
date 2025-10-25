import UserBlock from '../models/UserBlock.js';
export async function canViewVideo(userId, video) {
  if (!video) return false;
  if (!video.privacy?.is_private) return true;
  return String(video.user_id) === String(userId);
}
export async function isBlocked(a,b){
  if (!a || !b) return false;
  const blocked = await UserBlock.findOne({ blocker_id: a, blocked_id: b });
  const blocked2 = await UserBlock.findOne({ blocker_id: b, blocked_id: a });
  return !!(blocked || blocked2);
}
