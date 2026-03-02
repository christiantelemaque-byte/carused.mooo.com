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
  // Only allow internal cron with secret token
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
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

    // Find inactive posts older than 14 days
    const { data: oldPosts, error: fetchError } = await supabase
      .from('posts')
      .select('id, images')
      .lt('created_at', cutoffIso);

    if (fetchError) {
      console.error('Error fetching old posts:', fetchError);
      return res.status(500).json({ error: 'Database fetch failed' });
    }

    const results = [];
    for (const post of oldPosts) {
      const postId = post.id;
      const imageUrls = post.images || [];
      const imageDeletions = [];

      // Delete each image from GitHub
      for (const url of imageUrls) {
        try {
          const filePath = extractFilePathFromUrl(url);
          if (!filePath) continue;

          const githubApiUrl = `https://api.github.com/repos/${process.env.PICSER_GITHUB_OWNER}/${process.env.PICSER_GITHUB_REPO}/contents/${filePath}`;
          
          // Get SHA
          const getRes = await fetch(githubApiUrl, {
            headers: {
              Authorization: `token ${process.env.PICSER_GITHUB_TOKEN}`,
              Accept: 'application/vnd.github.v3+json',
            },
          });
          if (getRes.ok) {
            const fileInfo = await getRes.json();
            const sha = fileInfo.sha;

            // Delete file
            const deleteRes = await fetch(githubApiUrl, {
              method: 'DELETE',
              headers: {
                Authorization: `token ${process.env.PICSER_GITHUB_TOKEN}`,
                Accept: 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                message: `Auto‑cleanup of inactive post ${postId}`,
                sha,
                branch: process.env.PICSER_GITHUB_BRANCH || 'main',
              }),
            });

            if (deleteRes.ok) {
              imageDeletions.push({ url, success: true });
            } else {
              const errText = await deleteRes.text();
              imageDeletions.push({ url, success: false, error: errText });
            }
          } else {
            imageDeletions.push({ url, success: false, error: 'File not found' });
          }
        } catch (err) {
          imageDeletions.push({ url, success: false, error: err.message });
        }
      }

      // Delete post from Supabase
      const { error: deleteError } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      results.push({
        postId,
        deleted: !deleteError,
        supabaseError: deleteError?.message,
        imageDeletions,
      });
    }

    res.status(200).json({
      message: `Cleanup completed. Processed ${results.length} posts.`,
      results,
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({ error: error.message });
  }
}
