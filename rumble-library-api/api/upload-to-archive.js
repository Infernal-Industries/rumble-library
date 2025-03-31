const fetch = require('node-fetch');
const FormData = require('form-data');

// Rate limiting configuration
const RATE_LIMIT = {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10 // max requests per minute
};

// In-memory store for rate limiting (resets every deployment)
const requestCounts = new Map();

function isRateLimited(ip) {
    const now = Date.now();
    const userRequests = requestCounts.get(ip) || [];
    
    // Clean up old requests
    const recentRequests = userRequests.filter(timestamp => 
        now - timestamp < RATE_LIMIT.windowMs
    );
    
    // Check if rate limit is exceeded
    if (recentRequests.length >= RATE_LIMIT.maxRequests) {
        return true;
    }
    
    // Update requests
    recentRequests.push(now);
    requestCounts.set(ip, recentRequests);
    return false;
}

module.exports = async (req, res) => {
    // Handle CORS
    res.setHeader('Access-Control-Allow-Origin', 'https://yourusername.github.io');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight request
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    try {
        // Check rate limit
        const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        if (isRateLimited(clientIp)) {
            res.status(429).json({ error: 'Too many requests. Please try again later.' });
            return;
        }

        // Validate request
        if (!req.body || !req.body.file) {
            res.status(400).json({ error: 'Missing file data' });
            return;
        }

        const { file, identifier, title, description, subject } = req.body;

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
                'Authorization': `LOW ${process.env.ARCHIVE_ACCESS_KEY}:${process.env.ARCHIVE_SECRET_KEY}`
            }
        });

        if (!response.ok) {
            throw new Error(`Internet Archive upload failed: ${response.statusText}`);
        }

        const data = await response.json();
        res.status(200).json(data);

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ 
            error: 'Failed to upload video',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}; 