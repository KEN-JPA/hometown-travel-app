// @ts-nocheck
import { Redis } from '@upstash/redis';

const LIVE_STATE_KEY = 'family_travel_state';
const BACKUP_LIST_KEY = 'family_travel_state_backups';
const MAX_BACKUPS = Number(process.env.TRIP_BACKUP_LIMIT || 50);

const hasTravelState = (value: any) => {
  return value && typeof value === 'object' && value.state && Array.isArray(value.state.trips);
};

const summarizeBackup = (entry: any) => {
  const trips = entry?.data?.state?.trips || [];
  const deletedTrips = entry?.data?.state?.deletedTrips || [];

  return {
    id: entry?.id,
    createdAt: entry?.createdAt,
    source: entry?.source,
    tripCount: trips.length,
    deletedTripCount: deletedTrips.length,
    tripNames: trips.map((trip: any) => trip.tripName).filter(Boolean),
  };
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

    const currentData = await redis.get(LIVE_STATE_KEY);
    if (!hasTravelState(currentData)) {
      return res.status(409).json({
        error: 'No travel state found',
        message: 'Current travel data was not found, so no backup was created.',
      });
    }

    const now = new Date().toISOString();
    const backup = {
      id: `manual-${now}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: now,
      source: req.body?.source || 'manual-dashboard',
      data: currentData,
    };

    await redis.lpush(BACKUP_LIST_KEY, backup);
    await redis.ltrim(BACKUP_LIST_KEY, 0, Math.max(0, MAX_BACKUPS - 1));

    return res.status(200).json({
      success: true,
      backup: summarizeBackup(backup),
    });
  } catch (error: any) {
    console.error('Failed to create trip backup:', error);
    return res.status(500).json({
      error: 'Failed to create backup',
      message: error.message,
      stack: error.stack,
    });
  }
}
