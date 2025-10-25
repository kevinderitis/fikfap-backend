// TODO: validar firma 'CF-Stream-Signature' y actualizar Video segun 'uid' -> playback/thumbnail
export default async function streamWebhook(req, res) {
  return res.json({ ok: true });
}
