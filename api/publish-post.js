// api/publish-post.js
import { createClient } from '@supabase/supabase-js'

export const config = {
  api: {
    bodyParser: false, // Disable bodyParser to handle multipart/form-data
  },
}

export default async function handler(req, res) {
  // Set CORS headers (allow your GitHub Pages domain)
  res.setHeader('Access-Control-Allow-Origin', 'https://escortcanada.mooo.com')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Parse multipart form data using a library like `busboy` or `multer`
    // For simplicity, we'll use `busboy` – install it first: npm install busboy
    const busboy = require('busboy')
    const bb = busboy({ headers: req.headers })

    const fields = {}
    const files = []

    await new Promise((resolve, reject) => {
      bb.on('field', (name, val) => {
        fields[name] = val
      })
      bb.on('file', (name, file, info) => {
        const chunks = []
        file.on('data', (chunk) => chunks.push(chunk))
        file.on('end', () => {
          files.push({
            fieldname: name,
            filename: info.filename,
            mimeType: info.mimeType,
            buffer: Buffer.concat(chunks),
          })
        })
      })
      bb.on('error', reject)
      bb.on('close', resolve)
      req.pipe(bb)
    })

    const { title, description } = fields
    if (!title || !description) {
      return res.status(400).json({ error: 'Missing title or description' })
    }

    // Environment variables (set these in Vercel)
    const PICSER_URL = 'https://picser.pages.dev/api/public-upload'
    const GITHUB_TOKEN = process.env.PICSER_GITHUB_TOKEN
    const GITHUB_OWNER = process.env.PICSER_GITHUB_OWNER
    const GITHUB_REPO = process.env.PICSER_GITHUB_REPO
    const GITHUB_BRANCH = process.env.PICSER_GITHUB_BRANCH || 'main'
    const GITHUB_FOLDER = process.env.PICSER_FOLDER || 'uploads'

    // Upload each file to Picser
    const uploadedUrls = []
    for (const file of files.slice(0, 5)) {
      const formData = new FormData()
      formData.append('file', new Blob([file.buffer]), file.filename)
      formData.append('github_token', GITHUB_TOKEN)
      formData.append('github_owner', GITHUB_OWNER)
      formData.append('github_repo', GITHUB_REPO)
      formData.append('github_branch', GITHUB_BRANCH)
      formData.append('folder', GITHUB_FOLDER)

      const response = await fetch(PICSER_URL, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Picser error:', response.status, errorText)
        continue // skip this file but keep processing others
      }

      const json = await response.json()
      const url = json?.url || json?.urls?.jsdelivr_commit || json?.urls?.jsdelivr
      if (url) uploadedUrls.push(url)
    }

    // Save post to Supabase
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const { data, error } = await supabase
      .from('posts')
      .insert({ title, description, images: uploadedUrls })

    if (error) throw error

    res.status(200).json({ success: true, urls: uploadedUrls })
  } catch (error) {
    console.error('Error in publish-post:', error)
    res.status(500).json({ error: error.message })
  }
}
