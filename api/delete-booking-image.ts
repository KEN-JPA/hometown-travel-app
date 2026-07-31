// @ts-nocheck
import { Redis } from '@upstash/redis';

const IMAGE_KEY_PREFIX = 'family_travel_booking_image:';

const createRedis = () => new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

const isValidImageKey = (value: string) => /^[a-zA-Z0-9:_-]{1,180}$/.test(value);

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const imageKey = String(req.body?.imageKey || req.query?.key || '');

    if (!isValidImageKey(imageKey)) {
      return res.status(400).json({ error: 'Invalid image key' });
    }

    const redis = createRedis();
    await redis.del(`${IMAGE_KEY_PREFIX}${imageKey}`);

    return res.status(200).json({ success: true, imageKey });
  } catch (error: any) {
    console.error('Failed to delete booking image:', error);
    return res.status(500).json({
      error: 'Failed to delete booking image',
      message: error.message,
    });
  }
}
