// @ts-nocheck
import { Redis } from '@upstash/redis';

const BACKUP_LIST_KEY = 'family_travel_state_backups';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const redis = new Redis({
      url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '',
      token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '',
    });

    const limit = Math.min(Math.max(Number(req.query.limit || 20), 1), 100);
    const includeData = req.query.includeData === 'true';
    const backups = await redis.lrange(BACKUP_LIST_KEY, 0, limit - 1);

    const responseBackups = backups.map((backup: any) => {
      const entry = typeof backup === 'string' ? JSON.parse(backup) : backup;
      const trips = entry?.data?.state?.trips || [];
      const deletedTrips = entry?.data?.state?.deletedTrips || [];

      return {
        id: entry?.id,
        createdAt: entry?.createdAt,
        source: entry?.source,
        tripCount: trips.length,
        deletedTripCount: deletedTrips.length,
        tripNames: trips.map((trip: any) => trip.tripName).filter(Boolean),
        ...(includeData ? { data: entry?.data } : {}),
      };
    });

    return res.status(200).json({ backups: responseBackups });
  } catch (error: any) {
    console.error('Failed to get trip backups:', error);
    return res.status(500).json({
      error: 'Failed to retrieve backups',
      message: error.message,
      stack: error.stack,
    });
  }
}
