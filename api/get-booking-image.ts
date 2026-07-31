// @ts-nocheck
import { Redis } from '@upstash/redis';

const IMAGE_KEY_PREFIX = 'family_travel_booking_image:';

const createRedis = () => new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

const isValidImageKey = (value: string) => /^[a-zA-Z0-9:_-]{1,180}$/.test(value);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const imageKey = String(req.query?.key || '');

    if (!isValidImageKey(imageKey)) {
      return res.status(400).json({ error: 'Invalid image key' });
    }

    const redis = createRedis();
    const imageData = await redis.get(`${IMAGE_KEY_PREFIX}${imageKey}`);

    if (!imageData) {
      return res.status(404).json({ error: 'Image not found' });
    }

    res.setHeader('Cache-Control', 'private, max-age=3600');
    return res.status(200).json({ imageKey, imageData });
  } catch (error: any) {
    console.error('Failed to get booking image:', error);
    return res.status(500).json({
      error: 'Failed to get booking image',
      message: error.message,
    });
  }
}
