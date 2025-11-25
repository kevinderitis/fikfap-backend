import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export async function presign({ bucket, key, contentType, expires = 300 }) {
  console.log('───────────────────────────────────────────────');
  console.log('[S3 PRESIGN] 🟦 Iniciando generación de presigned URL...');
  console.log('[S3 PRESIGN] Parámetros recibidos:', {
    bucket,
    key,
    contentType,
    expires,
  });

  try {
    const cmd = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
    });

    console.log('[S3 PRESIGN] 🟩 PutObjectCommand generado:', {
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
    });

    const url = await getSignedUrl(s3, cmd, { expiresIn: expires });

    console.log('[S3 PRESIGN] ✅ Presigned URL generada correctamente.');
    console.log('[S3 PRESIGN] URL:', url);
    console.log('───────────────────────────────────────────────');

    return url;

  } catch (err) {
    console.error('───────────────────────────────────────────────');
    console.error('[S3 PRESIGN] ❌ ERROR al generar presigned URL');
    console.error('[S3 PRESIGN] Error message:', err.message);
    console.error('[S3 PRESIGN] Error stack:', err.stack);
    console.error('[S3 PRESIGN] ERROR COMPLETO:', err);
    console.error('───────────────────────────────────────────────');

    throw err;
  }
}