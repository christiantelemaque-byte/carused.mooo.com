// api/save-post.js
import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  // 1. Enable CORS for your site
  res.setHeader('Access-Control-Allow-Origin', 'https://escortcanada.mooo.com')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // 2. Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // 3. Parse request body
    const { title, description, imageUrls } = req.body

    // 4. Create Supabase client with server-side credentials
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role for admin operations
    )

    // 5. Insert data into your 'posts' table
    const { data, error } = await supabase
      .from('posts')
      .insert({ title, description, images: imageUrls })

    if (error) throw error

    // 6. Return success
    res.status(200).json({ success: true, data })
  } catch (error) {
    console.error('Error saving post:', error)
    res.status(500).json({ error: error.message })
  }
}
