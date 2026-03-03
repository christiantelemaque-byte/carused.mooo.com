import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://escortcanada.mooo.com');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { postId, userId, title, description, imageUrls } = req.body;
    if (!postId || !userId || !title || !description || !Array.isArray(imageUrls)) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Verify ownership
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('user_id')
      .eq('id', postId)
      .single();

    if (fetchError || !post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    if (post.user_id !== userId) {
      return res.status(403).json({ error: 'You do not own this post' });
    }

    // Update post
    const { error: updateError } = await supabase
      .from('posts')
      .update({ title, description, images: imageUrls })
      .eq('id', postId);

    if (updateError) throw updateError;

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ error: error.message });
  }
}
