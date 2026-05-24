// @ts-nocheck
import { Redis } from '@upstash/redis';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const redis = new Redis({
      url: process.env.KV_REST_API_URL || '',
      token: process.env.KV_REST_API_TOKEN || '',
    });

    const data = req.body;
    
    // Save the entire trips array to KV
    await redis.set('family_travel_state', data);
    
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Failed to save trips:', error);
    return res.status(500).json({ error: 'Failed to save data' });
  }
}
