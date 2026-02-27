// api/save-post.js
import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  // Set CORS headers – allows your GitHub Pages site to call this function
  res.setHeader('Access-Control-Allow-Origin', 'https://escortcanada.mooo.com')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { title, description, imageUrls } = req.body

    // Create Supabase client with service role key (bypasses RLS)
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // Insert into your 'posts' table
    const { data, error } = await supabase
      .from('posts')
      .insert({ title, description, images: imageUrls })

    if (error) throw error

    res.status(200).json({ success: true, data })
  } catch (error) {
    console.error('Error saving post:', error)
    res.status(500).json({ error: error.message })
  }
}
