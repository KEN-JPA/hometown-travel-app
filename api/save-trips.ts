// @ts-nocheck
import { Redis } from '@upstash/redis';

const LIVE_STATE_KEY = 'family_travel_state';
const BACKUP_LIST_KEY = 'family_travel_state_backups';
const MAX_BACKUPS = Number(process.env.TRIP_BACKUP_LIMIT || 50);

const hasTravelState = (value: any) => {
  return value && typeof value === 'object' && value.state && Array.isArray(value.state.trips);
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const redis = new Redis({
      url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '',
      token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '',
    });

    const data = req.body;

    const currentData = await redis.get(LIVE_STATE_KEY);
    if (hasTravelState(currentData) && JSON.stringify(currentData) !== JSON.stringify(data)) {
      await redis.lpush(BACKUP_LIST_KEY, {
        id: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        source: 'api/save-trips',
        data: currentData,
      });
      await redis.ltrim(BACKUP_LIST_KEY, 0, Math.max(0, MAX_BACKUPS - 1));
    }
    
    // Save the current travel state after the previous version is archived.
    await redis.set(LIVE_STATE_KEY, data);
    
    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Failed to save trips:', error);
    return res.status(500).json({ 
      error: 'Failed to save data',
      message: error.message,
      stack: error.stack
    });
  }
}
