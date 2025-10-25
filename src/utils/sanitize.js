export function sanitizeText(s='') {
  return String(s).substring(0, 2200);
}
export function extractMentionsAndHashtags(text='') {
  const mentions = [...text.matchAll(/@([a-zA-Z0-9_]+)/g)].map(m=>m[1].toLowerCase());
  const hashtags = [...text.matchAll(/#([\p{L}0-9_]+)/gu)].map(h=>h[1].toLowerCase());
  return { mentions, hashtags };
}
