import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { identifier } = req.query;
    
    if (!identifier) {
      return res.status(400).json({ error: 'Identifier is required' });
    }

    // Check if the video is available for download
    const response = await fetch(`https://archive.org/download/${identifier}/${identifier}.mp4`);
    
    res.json({
      isProcessed: response.ok
    });
  } catch (error) {
    console.error('Check processing error:', error);
    res.status(500).json({ error: 'Failed to check processing status' });
  }
} 