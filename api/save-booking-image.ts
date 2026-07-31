// @ts-nocheck
import { Redis } from '@upstash/redis';

const IMAGE_KEY_PREFIX = 'family_travel_booking_image:';
const MAX_IMAGE_DATA_CHARS = Number(process.env.BOOKING_IMAGE_MAX_CHARS || 3_000_000);

const createRedis = () => new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

const isValidImageKey = (value: string) => /^[a-zA-Z0-9:_-]{1,180}$/.test(value);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const imageKey = String(req.body?.imageKey || '');
    const imageData = String(req.body?.imageData || '');

    if (!isValidImageKey(imageKey)) {
      return res.status(400).json({ error: 'Invalid image key' });
    }

    if (!imageData.startsWith('data:image/')) {
      return res.status(400).json({ error: 'Invalid image data' });
    }

    if (imageData.length > MAX_IMAGE_DATA_CHARS) {
      return res.status(413).json({
        error: 'Image too large',
        message: '画像が大きすぎます。スクリーンショットを少し小さくしてから再度追加してください。',
      });
    }

    const redis = createRedis();
    await redis.set(`${IMAGE_KEY_PREFIX}${imageKey}`, imageData);

    return res.status(200).json({ success: true, imageKey });
  } catch (error: any) {
    console.error('Failed to save booking image:', error);
    return res.status(500).json({
      error: 'Failed to save booking image',
      message: error.message,
    });
  }
}
