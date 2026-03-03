// api/publish-post.js
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://escortcanada.mooo.com');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { title, description, imageUrls, userId, isVip } = req.body;
    if (!title || !description || !Array.isArray(imageUrls) || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Optional geolocation (ip‑based)
    const ip = (req.headers['x-forwarded-for'] || req.connection.remoteAddress || '').split(',')[0].trim();
    let location = { city: null, region: null, country: null };
    if (ip && ip !== '::1' && ip !== '127.0.0.1') {
      try {
        const geoRes = await fetch(`http://ip-api.com/json/${ip}?fields=city,region,country`);
        const geoData = await geoRes.json();
        if (geoData && geoData.city && geoData.region && geoData.country) {
          location = { city: geoData.city, region: geoData.region, country: geoData.country };
        }
      } catch (geoErr) {
        console.error('Geolocation error:', geoErr);
      }
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { error } = await supabase.from('posts').insert({
      user_id: userId,
      title,
      description,
      images: imageUrls,
      is_vip: isVip ? true : false, // ensures a boolean, never null
      location,
    });

    if (error) throw error;

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Save error:', error);
    res.status(500).json({ error: error.message });
  }
}
