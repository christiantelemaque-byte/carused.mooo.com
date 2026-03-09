// api/cleanup-posts.js
import { createClient } from '@supabase/supabase-js';

// Helper to extract file path from GitHub URL (same as delete-post.js)
function extractFilePathFromUrl(url) {
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname.includes('jsdelivr')) {
      const pathParts = urlObj.pathname.split('/');
      if (pathParts.length >= 4 && pathParts[1] === 'gh') {
        return pathParts.slice(4).join('/');
      }
    } else if (urlObj.hostname.includes('githubusercontent')) {
      const pathParts = urlObj.pathname.split('/');
      if (pathParts.length >= 5) {
        return pathParts.slice(4).join('/');
      }
    }
    return null;
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  // Only allow internal cron with secret token (or Vercel Cron)
  const isVercelCron = req.headers['x-vercel-cron'] === 'true';
  const authHeader = req.headers.authorization;
  const hasValidToken = authHeader === `Bearer ${process.env.CRON_SECRET}`;

  if (!isVercelCron && !hasValidToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Calculate date 14 days ago
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 14);
    const cutoffIso = cutoffDate.toISOString();

    // Find active posts older than 14 days
    const { data: oldPosts, error: fetchError } = await supabase
      .from('posts')
      .select('id, images')
      .eq('status', 'active')
      .lt('created_at', cutoffIso);

    if (fetchError) {
      console.error('Error fetching old posts:', fetchError);
      return res.status(500).json({ error: 'Database fetch failed' });
    }

    const githubToken = process.env.PICSER_GITHUB_TOKEN;
    const githubOwner = process.env.PICSER_GITHUB_OWNER;
    const githubRepo = process.env.PICSER_GITHUB_REPO;
    const githubBranch = process.env.PICSER_GITHUB_BRANCH || 'main';

    for (const post of oldPosts) {
      // 1. Delete images from GitHub (optional but recommended)
      if (githubToken && githubOwner && githubRepo && post.images) {
        for (const url of post.images) {
          try {
            const filePath = extractFilePathFromUrl(url);
            if (!filePath) continue;

            const githubApiUrl = `https://api.github.com/repos/${githubOwner}/${githubRepo}/contents/${filePath}`;
            
            const getRes = await fetch(githubApiUrl, {
              headers: {
                Authorization: `token ${githubToken}`,
                Accept: 'application/vnd.github.v3+json',
              },
            });
            if (getRes.ok) {
              const fileInfo = await getRes.json();
              const sha = fileInfo.sha;

              await fetch(githubApiUrl, {
                method: 'DELETE',
                headers: {
                  Authorization: `token ${githubToken}`,
                  Accept: 'application/vnd.github.v3+json',
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  message: `Auto‑cleanup of post ${post.id}`,
                  sha,
                  branch: githubBranch,
                }),
              });
            }
          } catch (err) {
            console.error('Failed to delete GitHub image', url, err);
          }
        }
      }

      // 2. Anonymize and soft‑delete the post in Supabase
      const { error: updateError } = await supabase
        .from('posts')
        .update({
          title: null,           // clear title
          description: null,     // clear description
          images: '[]',          // empty array
          location: null,        // clear location
          status: 'deleted',     // mark as deleted
          // updated_at will auto‑update via trigger
        })
        .eq('id', post.id);

      if (updateError) {
        console.error('Error updating post', post.id, updateError);
      }
    }

    res.status(200).json({
      message: `Cleanup completed. Processed ${oldPosts.length} posts.`,
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({ error: error.message });
  }
}
