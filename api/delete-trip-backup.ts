// @ts-nocheck
import { Redis } from '@upstash/redis';

const BACKUP_LIST_KEY = 'family_travel_state_backups';

const parseBackupEntry = (backup: any) => {
  if (typeof backup !== 'string') return backup;

  try {
    return JSON.parse(backup);
  } catch {
    return null;
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'DELETE') {
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
    const remaining = [];
    let deletedBackup = null;

    for (const backup of backups) {
      const entry = parseBackupEntry(backup);
      if (!deletedBackup && entry?.id === backupId) {
        deletedBackup = entry;
        continue;
      }
      remaining.push(backup);
    }

    if (!deletedBackup) {
      return res.status(404).json({ error: 'Backup not found' });
    }

    await redis.del(BACKUP_LIST_KEY);
    if (remaining.length > 0) {
      await redis.rpush(BACKUP_LIST_KEY, ...remaining);
    }

    return res.status(200).json({
      success: true,
      deletedId: backupId,
      deletedCreatedAt: deletedBackup.createdAt,
    });
  } catch (error: any) {
    console.error('Failed to delete trip backup:', error);
    return res.status(500).json({
      error: 'Failed to delete backup',
      message: error.message,
      stack: error.stack,
    });
  }
}
