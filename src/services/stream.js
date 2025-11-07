import fetch from 'node-fetch';
const API = `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/stream`;

export async function createDirectUpload(name = "video") {
  try {
    console.log(`[STREAM] Solicitando direct upload para "${name}"...`);

    const body = {
      maxDurationSeconds: 600,
      creator: 'backend',
      allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || []
    };

    console.log("[STREAM] Enviando request a:", `${API}/direct_upload`);
    console.log("[STREAM] Body:", body);

    const res = await fetch(`${API}/direct_upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CF_STREAM_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const json = await res.json().catch(() => ({}));

    console.log(`[STREAM] Status: ${res.status}`);
    console.log("[STREAM] Response JSON:", json);

    if (!res.ok || !json.success) {
      console.error("[STREAM] ❌ Error al crear direct upload:", json.errors || json);
      throw new Error(`Cloudflare Stream error (${res.status}): ${JSON.stringify(json.errors || json)}`);
    }

    console.log("[STREAM] ✅ Direct upload creado correctamente:", json.result);
    return json.result; // { uploadURL, uid }

  } catch (err) {
    console.error("[STREAM] 🚨 Excepción al crear direct upload:", err.message);
    throw err;
  }
}

export async function setVideoPublic(uid, origins = ['*']) {
  const API = `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/stream/${uid}`;
  const body = {
    requireSignedURLs: false,
    allowedOrigins: origins && origins.length ? origins : [],
  };

  console.log(`[STREAM] PATCH → ${API}`, body);

  const res = await fetch(API, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${process.env.CF_STREAM_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) {
    console.error('[STREAM] PATCH policy error:', json);
    throw new Error(`PATCH failed: ${res.status} ${JSON.stringify(json.errors || json)}`);
  }

  console.log('[STREAM] ✅ Políticas públicas aplicadas a', uid);
  return json.result;
}