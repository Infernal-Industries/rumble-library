async function uploadToArchive(file, metadata) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('identifier', metadata.identifier);
    formData.append('title', metadata.title);
    formData.append('description', metadata.description);
    formData.append('subject', metadata.tags.join(','));

    try {
        const response = await fetch('/api/upload-to-archive', {
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
        const response = await fetch(`/api/check-processing?identifier=${identifier}`);
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