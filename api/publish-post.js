// api/publish-post.js
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://escortcanada.mooo.com');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { title, description, imageUrls } = req.body;
    if (!title || !description || !Array.isArray(imageUrls)) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { error } = await supabase.from('posts').insert({ title, description, images: imageUrls });
    if (error) throw error;

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Save error:', error);
    res.status(500).json({ error: error.message });
  }
}
