// api/publish-post.js
import { createClient } from '@supabase/supabase-js';

// List of keywords that may indicate a scam
const scamKeywords = [
  'urgent', 'wire transfer', 'western union', 'moneygram', 'gift card',
  'paypal', 'cash app', 'zelle', 'bitcoin', 'crypto', 'deposit',
  'advance fee', 'credit card', 'bank transfer', 'send money', 'prepaid'
];

function containsScam(text) {
  const lower = text.toLowerCase();
  return scamKeywords.some(keyword => lower.includes(keyword));
}

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

    // --- Scam check ---
    if (containsScam(description)) {
      // If scam‑like content is detected, the user must be VIP
      const supabaseForCheck = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      const { data: profile, error: profileError } = await supabaseForCheck
        .from('profiles')
        .select('subscription_type')
        .eq('id', userId)
        .single();

      if (profileError || !profile || profile.subscription_type !== 'vip') {
        return res.status(403).json({
          error: 'This post contains suspicious content and requires a VIP subscription to publish.'
        });
      }
    }

    // --- Geolocation (same as before) ---
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
      is_vip: isVip ? true : false,
      location,
    });

    if (error) throw error;

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Save error:', error);
    res.status(500).json({ error: error.message });
  }
        }
