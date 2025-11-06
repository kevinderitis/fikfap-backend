import fetch from 'node-fetch';

const API = `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/stream`;

/**
 * Aplica política pública (sin validaciones) a un video de Stream.
 */
async function setPublicPolicy(uid, { origins = ['*'] } = {}) {
  const body = {
    requireSignedURLs: false,
    allowedOrigins: origins.length ? origins : ['*'],
  };

  console.log(`[STREAM] PATCH políticas públicas → uid=${uid}`, body);

  const res = await fetch(`${API}/${uid}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${process.env.CF_STREAM_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const json = await res.json().catch(() => ({}));
  console.log(`[STREAM] PATCH status=${res.status}`, json);

  if (!res.ok || json.success === false) {
    throw new Error(`No se pudo fijar políticas públicas: ${res.status} ${JSON.stringify(json.errors || json)}`);
  }
  return json.result;
}

/**
 * Crea un Direct Upload y deja el video en modo público (sin validaciones).
 */
export async function createDirectUpload(name = 'video') {
  try {
    const allowedOrigins =
      (process.env.ALLOWED_ORIGINS?.split(',').map(s => s.trim()).filter(Boolean)) || ['*'];

    const body = {
      maxDurationSeconds: 600,
      creator: 'backend',
      // Esto fija los orígenes permitidos en el recurso inicial:
      allowedOrigins, // si querés que SIEMPRE sea 100% abierto, dejá ['*']
      // NOTA: requireSignedURLs NO siempre se acepta en direct_upload;
      // lo fijamos con PATCH inmediatamente después usando setPublicPolicy().
    };

    console.log(`[STREAM] Solicitando direct upload "${name}"...`);
    console.log('[STREAM] POST →', `${API}/direct_upload`, body);

    const res = await fetch(`${API}/direct_upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.CF_STREAM_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const json = await res.json().catch(() => ({}));
    console.log(`[STREAM] direct_upload status=${res.status}`, json);

    if (!res.ok || json.success === false) {
      throw new Error(`Cloudflare Stream error (${res.status}): ${JSON.stringify(json.errors || json)}`);
    }

    const { uploadURL, uid } = json.result || {};
    if (!uid || !uploadURL) {
      throw new Error('Respuesta inválida de Cloudflare: falta uid o uploadURL');
    }

    // 🔓 Fijamos políticas públicas para que reproduzca en cualquier lado (sin tokens)
    await setPublicPolicy(uid, { origins: allowedOrigins.length ? allowedOrigins : ['*'] });

    console.log('[STREAM] ✅ Direct upload creado y políticas públicas aplicadas:', { uid, uploadURL });

    // Dejo todo lo útil que pueda necesitar front/back:
    return {
      uid,
      uploadURL,
      // URLs de reproducción/listo para guardar en tu DB
      player_url: `https://iframe.videodelivery.net/${uid}`,
      // M3U8 estándar (si preferís tu subdominio customer, podés reemplazarlo)
      hls_url: `https://videodelivery.net/${uid}/manifest/video.m3u8`,
      // Thumbnail por defecto
      thumbnail_url: `https://videodelivery.net/${uid}/thumbnails/thumbnail.jpg`,
    };
  } catch (err) {
    console.error('[STREAM] 🚨 Error en createDirectUpload:', err?.message || err);
    throw err;
  }
}