// api/get-updates.js
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://escortcanada.mooo.com');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { lastFetch } = req.body;
    if (!lastFetch) return res.status(400).json({ error: 'Missing lastFetch' });

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 1. Get new/updated posts (status = 'active')
    const { data: updatedPosts, error: postsError } = await supabase
      .from('posts')
      .select('*, profiles(username)')
      .gte('updated_at', lastFetch)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (postsError) throw postsError;

    // 2. Get deleted post IDs (status = 'deleted' and updated after lastFetch)
    const { data: deletedPosts, error: deletedError } = await supabase
      .from('posts')
      .select('id')
      .gte('updated_at', lastFetch)
      .eq('status', 'deleted');

    if (deletedError) throw deletedError;

    const deletedIds = deletedPosts.map(p => p.id);

    res.status(200).json({
      posts: updatedPosts || [],
      deleted: deletedIds,
    });
  } catch (error) {
    console.error('Get updates error:', error);
    res.status(500).json({ error: error.message });
  }
}
