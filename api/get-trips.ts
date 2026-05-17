import { Redis } from '@upstash/redis';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const redis = new Redis({
      url: process.env.KV_REST_API_URL || '',
      token: process.env.KV_REST_API_TOKEN || '',
    });

    const data = await redis.get('family_travel_state');
    
    // Return empty array if no data is found
    return res.status(200).json(data || []);
  } catch (error) {
    console.error('Failed to get trips:', error);
    return res.status(500).json({ error: 'Failed to retrieve data' });
  }
}
