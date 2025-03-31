// API endpoints configuration
const API_CONFIG = {
    // Base URL for all API endpoints
    baseUrl: 'https://rumblelibraryapi-g9h0uq7o7-infernos-projects-e00099b9.vercel.app',
    
    endpoints: {
        // Video upload endpoints
        upload: {
            toArchive: '/api/upload-to-archive',
            checkProcessing: '/api/check-processing',
            updateMoves: '/api/update-moves'
        },
        
        // Discord authentication endpoints
        auth: {
            callback: '/api/auth/discord/callback',
            verify: '/api/auth/verify'
        }
    }
};

// Helper function to get full API URL
function getApiUrl(endpointPath) {
    return `${API_CONFIG.baseUrl}${endpointPath}`;
}

// Export configuration
window.apiConfig = {
    ...API_CONFIG,
    getApiUrl
}; 