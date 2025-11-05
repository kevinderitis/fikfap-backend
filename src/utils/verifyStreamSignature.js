import crypto from 'crypto';

export function verifyStreamSignature(req) {
  const secret = process.env.CF_STREAM_WEBHOOK_SECRET;
  if (!secret) return false;

  const header = req.headers['webhook-signature'] || '';
  // Formato: time=1730800000,sig1=<hex>
  const parts = Object.fromEntries(
    String(header).split(',').map(p => p.trim().split('=').map(s => s.trim()))
  );

  const time = parts.time;
  const sig1 = parts.sig1;
  if (!time || !sig1) return false;

  // anti-replay (5 minutos)
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - Number(time)) > 300) return false;

  // source string = `${time}.${rawBody}`
  const raw = req.rawBody; // Buffer
  const source = Buffer.concat([Buffer.from(String(time)), Buffer.from('.'), raw]);

  const expected = crypto.createHmac('sha256', secret).update(source).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(sig1, 'hex'));
  } catch {
    return false;
  }
}