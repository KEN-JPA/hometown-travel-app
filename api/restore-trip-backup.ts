// @ts-nocheck
import { Redis } from '@upstash/redis';

const LIVE_STATE_KEY = 'family_travel_state';
const BACKUP_LIST_KEY = 'family_travel_state_backups';
const MAX_BACKUPS = Number(process.env.TRIP_BACKUP_LIMIT || 50);

const hasTravelState = (value: any) => {
  return value && typeof value === 'object' && value.state && Array.isArray(value.state.trips);
};

const parseBackupEntry = (backup: any) => {
  if (typeof backup !== 'string') return backup;

  try {
    return JSON.parse(backup);
  } catch {
    return null;
  }
};

const summarizeState = (data: any) => {
  const trips = data?.state?.trips || [];
  const deletedTrips = data?.state?.deletedTrips || [];

  return {
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

    const backupId = req.body?.id || req.query?.id;
    if (!backupId) {
      return res.status(400).json({ error: 'Missing backup id' });
    }

    const backups = await redis.lrange(BACKUP_LIST_KEY, 0, -1);
    let targetBackup = null;

    for (const backup of backups) {
      const entry = parseBackupEntry(backup);
      if (entry?.id === backupId) {
        targetBackup = entry;
        break;
      }
    }

    if (!targetBackup) {
      return res.status(404).json({ error: 'Backup not found' });
    }

    if (!hasTravelState(targetBackup.data)) {
      return res.status(409).json({
        error: 'Invalid backup data',
        message: 'The selected backup does not contain a valid travel state.',
      });
    }

    const currentData = await redis.get(LIVE_STATE_KEY);
    const now = new Date().toISOString();

    if (hasTravelState(currentData) && JSON.stringify(currentData) !== JSON.stringify(targetBackup.data)) {
      await redis.lpush(BACKUP_LIST_KEY, {
        id: `before-restore-${now}-${Math.random().toString(36).slice(2, 8)}`,
        createdAt: now,
        source: 'api/restore-trip-backup:before-restore',
        data: currentData,
      });
      await redis.ltrim(BACKUP_LIST_KEY, 0, Math.max(0, MAX_BACKUPS - 1));
    }

    await redis.set(LIVE_STATE_KEY, targetBackup.data);

    return res.status(200).json({
      success: true,
      restoredFrom: {
        id: targetBackup.id,
        createdAt: targetBackup.createdAt,
        source: targetBackup.source,
      },
      restoredState: summarizeState(targetBackup.data),
    });
  } catch (error: any) {
    console.error('Failed to restore trip backup:', error);
    return res.status(500).json({
      error: 'Failed to restore backup',
      message: error.message,
      stack: error.stack,
    });
  }
}
