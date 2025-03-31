const fetch = require('node-fetch');

// Simple cache with 5-minute TTL
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCachedResult(identifier) {
    const cached = cache.get(identifier);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.result;
    }
    return null;
}

function setCachedResult(identifier, result) {
    cache.set(identifier, {
        result,
        timestamp: Date.now()
    });
}

module.exports = async (req, res) => {
    // Handle CORS
    res.setHeader('Access-Control-Allow-Origin', 'https://yourusername.github.io');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    
    // Handle preflight request
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Only allow GET requests
    if (req.method !== 'GET') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    try {
        const { identifier } = req.query;
        
        if (!identifier) {
            res.status(400).json({ error: 'Missing identifier parameter' });
            return;
        }

        // Check cache first
        const cachedResult = getCachedResult(identifier);
        if (cachedResult !== null) {
            res.json(cachedResult);
            return;
        }

        // Check if the video is available for download
        const response = await fetch(`https://archive.org/download/${identifier}/${identifier}.mp4`, {
            method: 'HEAD' // Only fetch headers, not the whole file
        });
        
        const result = { isProcessed: response.ok };
        
        // Cache the result
        setCachedResult(identifier, result);
        
        res.json(result);
    } catch (error) {
        console.error('Check processing error:', error);
        res.status(500).json({ 
            error: 'Failed to check processing status',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}; 