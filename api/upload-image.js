// api/upload-image.js
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://escortcanada.mooo.com');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const busboy = require('busboy');
    const bb = busboy({ headers: req.headers });

    let fileBuffer, filename, mimeType;

    await new Promise((resolve, reject) => {
      bb.on('file', (name, file, info) => {
        filename = info.filename;
        mimeType = info.mimeType;
        const chunks = [];
        file.on('data', chunk => chunks.push(chunk));
        file.on('end', () => { fileBuffer = Buffer.concat(chunks); });
      });
      bb.on('error', reject);
      bb.on('close', resolve);
      req.pipe(bb);
    });

    if (!fileBuffer) throw new Error('No file uploaded');

    const PICSER_URL = 'https://picser.pages.dev/api/public-upload';
    const formData = new FormData();
    formData.append('file', new Blob([fileBuffer], { type: mimeType }), filename);
    formData.append('github_token', process.env.PICSER_GITHUB_TOKEN);
    formData.append('github_owner', process.env.PICSER_GITHUB_OWNER);
    formData.append('github_repo', process.env.PICSER_GITHUB_REPO);
    formData.append('github_branch', process.env.PICSER_GITHUB_BRANCH || 'main');
    formData.append('folder', process.env.PICSER_FOLDER || 'uploads');

    const response = await fetch(PICSER_URL, { method: 'POST', body: formData });
    const responseText = await response.text();

    if (!response.ok) {
      console.error('Picser error response:', response.status, responseText);
      throw new Error(`Picser error: ${response.status} - ${responseText}`);
    }

    const json = JSON.parse(responseText);
    console.log('Picser JSON:', json);

    // ✅ Correct path: data.urls.jsdelivr_commit (or data.urls.jsdelivr)
    const url = json?.data?.urls?.jsdelivr_commit || json?.data?.urls?.jsdelivr;
    if (!url) {
      console.error('No URL found in response:', json);
      throw new Error('No URL from Picser');
    }

    console.log('Extracted URL:', url);
    res.status(200).json({ success: true, url });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
}
