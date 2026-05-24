// @ts-nocheck
import { Redis } from '@upstash/redis';

export default async function handler(req, res) {
  try {
    const redis = new Redis({
      url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '',
      token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '',
    });
    
    // データを完全にリセット（空の状態にする）
    await redis.set('family_travel_state', { trips: [], deletedTrips: [] });
    
    return res.status(200).json({ success: true, message: 'Database cleaned successfully' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
