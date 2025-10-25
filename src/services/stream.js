import fetch from 'node-fetch';
const API = `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/stream`;

export async function createDirectUpload(name="video") {
  const res = await fetch(`${API}/direct_upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.CF_STREAM_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ maxDurationSeconds: 600, creator: 'backend', allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || [] })
  });
  const json = await res.json();
  if (!json.success) throw new Error(JSON.stringify(json.errors));
  return json.result; // { uploadURL, uid }
}
