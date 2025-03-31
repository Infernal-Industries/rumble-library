const express = require('express');
const multer = require('multer');
const fs = require('fs').promises;
const path = require('path');
const fetch = require('node-fetch');
const FormData = require('form-data');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// Your Internet Archive S3 credentials
const ARCHIVE_ACCESS_KEY = process.env.ARCHIVE_ACCESS_KEY;
const ARCHIVE_SECRET_KEY = process.env.ARCHIVE_SECRET_KEY;

app.use(express.json());
app.use(express.static('public'));

// Handle video upload to Internet Archive
app.post('/api/upload-to-archive', upload.single('file'), async (req, res) => {
    try {
        const { file } = req;
        const { identifier, title, description, subject } = req.body;

        // Create form data for Internet Archive
        const formData = new FormData();
        formData.append('file', file.buffer, {
            filename: `${identifier}.mp4`,
            contentType: file.mimetype
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
                'Authorization': `LOW ${ARCHIVE_ACCESS_KEY}:${ARCHIVE_SECRET_KEY}`
            }
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
});

// Check processing status
app.get('/api/check-processing', async (req, res) => {
    try {
        const { identifier } = req.query;
        
        // Check if the video is available for download
        const response = await fetch(`https://archive.org/download/${identifier}/${identifier}.mp4`);
        
        res.json({
            isProcessed: response.ok
        });
    } catch (error) {
        console.error('Check processing error:', error);
        res.status(500).json({ error: 'Failed to check processing status' });
    }
});

// Update moves.json
app.post('/api/update-moves', async (req, res) => {
    try {
        const movesPath = path.join(__dirname, 'public', 'data', 'moves.json');
        const movesData = JSON.parse(await fs.readFile(movesPath, 'utf8'));
        
        // Add new move
        movesData.moves.push(req.body);
        
        // Write updated data
        await fs.writeFile(movesPath, JSON.stringify(movesData, null, 2));
        
        res.json({ success: true });
    } catch (error) {
        console.error('Update moves error:', error);
        res.status(500).json({ error: 'Failed to update moves data' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 