async function uploadToArchive(file, metadata) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('identifier', metadata.identifier);
    formData.append('title', metadata.title);
    formData.append('description', metadata.description);
    formData.append('subject', metadata.tags.join(','));

    try {
        const response = await fetch(window.apiConfig.getApiUrl(window.apiConfig.endpoints.upload.toArchive), {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('Upload failed');
        }

        return await response.json();
    } catch (error) {
        console.error('Upload error:', error);
        throw error;
    }
}

async function checkProcessingStatus(identifier) {
    try {
        const response = await fetch(
            window.apiConfig.getApiUrl(window.apiConfig.endpoints.upload.checkProcessing) +
            `?identifier=${identifier}`
        );
        
        if (!response.ok) {
            throw new Error('Failed to check processing status');
        }
        
        const data = await response.json();
        return data.isProcessed;
    } catch (error) {
        console.error('Processing check error:', error);
        throw error;
    }
}

async function updateMovesData(moveData) {
    try {
        const response = await fetch(window.apiConfig.getApiUrl(window.apiConfig.endpoints.upload.updateMoves), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(moveData)
        });

        if (!response.ok) {
            throw new Error('Failed to update moves data');
        }

        return await response.json();
    } catch (error) {
        console.error('Update moves error:', error);
        throw error;
    }
}

// Show upload status
function showUploadStatus(message, progress = null) {
    const status = document.querySelector('.upload-status');
    const messageEl = status.querySelector('.upload-status-message');
    const progressEl = status.querySelector('.upload-status-progress');

    if (status && messageEl) {
        messageEl.textContent = message;
        status.style.display = 'flex';

        if (progressEl && progress !== null) {
            progressEl.style.setProperty('--progress', `${progress}%`);
        }
    }
}

// Hide upload status
function hideUploadStatus() {
    const status = document.querySelector('.upload-status');
    if (status) {
        status.style.display = 'none';
    }
}

// Update upload progress
function updateUploadProgress(progress) {
    const progressEl = document.querySelector('.upload-status-progress');
    if (progressEl) {
        progressEl.style.setProperty('--progress', `${progress}%`);
    }
} 