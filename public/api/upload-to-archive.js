import formidable from 'formidable';
import fetch from 'node-fetch';
import FormData from 'form-data';
import { createReadStream } from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const form = new formidable.IncomingForm();
    const { fields, files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve({ fields, files });
      });
    });

    const { identifier, title, description, subject } = fields;
    const file = files.file;

    // Create form data for Internet Archive
    const formData = new FormData();
    formData.append('file', createReadStream(file.filepath), {
      filename: `${identifier}.mp4`,
      contentType: file.mimetype,
    });

    // Add metadata
    formData.append('identifier', identifier);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('subject', subject);
    formData.append('collection', 'rumble-library');
    formData.append('mediatype', 'movies');

    // Upload to Internet Archive
    const response = await fetch('https://archive.org/upload/', {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `LOW ${process.env.ARCHIVE_ACCESS_KEY}:${process.env.ARCHIVE_SECRET_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to upload to Internet Archive');
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload video' });
  }
} 