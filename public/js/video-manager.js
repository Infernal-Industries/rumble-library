class VideoManager {
    constructor() {
        this.archiveIdentifierPrefix = 'rumble-library-';
        this.processingVideos = new Map();
        this.maxProcessingChecks = 120; // 1 hour maximum wait time (120 checks * 30 seconds)
        this.checkInterval = 30000; // 30 seconds between checks
        this.setupUploadButton();
    }

    setupUploadButton() {
        const uploadButton = document.querySelector('.upload-button');
        if (!uploadButton) return;

        uploadButton.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'video/*';
            input.onchange = (e) => this.handleFileSelect(e);
            input.click();
        });
    }

    async handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Show metadata modal
        const metadata = await this.showMetadataModal();
        if (!metadata) return; // User cancelled

        try {
            await this.uploadVideo(file, metadata);
        } catch (error) {
            console.error('Error handling file:', error);
            this.showUploadError('Failed to process video. Please try again.');
        }
    }

    showMetadataModal() {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'metadata-modal';
            modal.innerHTML = `
                <div class="metadata-content">
                    <form id="metadata-form">
                        <div class="form-group">
                            <label for="title">Title</label>
                            <input type="text" id="title" required>
                        </div>
                        <div class="form-group">
                            <label for="notation">Notation</label>
                            <input type="text" id="notation" required>
                        </div>
                        <div class="form-group">
                            <label for="mechanics">Mechanics Used</label>
                            <textarea id="mechanics" required></textarea>
                        </div>
                        <div class="form-group">
                            <label for="goal">Goal Achieved</label>
                            <textarea id="goal" required></textarea>
                        </div>
                        <div class="form-group">
                            <label for="tags">Tags (comma separated)</label>
                            <input type="text" id="tags" required>
                        </div>
                        <div class="form-actions">
                            <button type="button" class="cancel">Cancel</button>
                            <button type="submit">Upload</button>
                        </div>
                    </form>
                </div>
            `;

            document.body.appendChild(modal);

            const form = modal.querySelector('form');
            const cancelButton = modal.querySelector('button.cancel');

            form.onsubmit = (e) => {
                e.preventDefault();
                const metadata = {
                    title: form.querySelector('#title').value,
                    notation: {
                        main: form.querySelector('#notation').value,
                        notes: []
                    },
                    mechanics: form.querySelector('#mechanics').value,
                    goal: form.querySelector('#goal').value,
                    tags: form.querySelector('#tags').value.split(',').map(tag => tag.trim())
                };
                modal.remove();
                resolve(metadata);
            };

            cancelButton.onclick = () => {
                modal.remove();
                resolve(null);
            };
        });
    }

    async uploadVideo(file, metadata) {
        this.showUploadStatus('Starting upload process...');

        try {
            // Generate a unique identifier
            const timestamp = Date.now();
            const identifier = `${this.archiveIdentifierPrefix}${timestamp}`;

            // Start upload to Internet Archive
            const archiveData = await this.uploadToArchive(file, identifier, metadata);
            
            // Start checking processing status
            this.startProcessingCheck(identifier, metadata);

            return {
                status: 'processing',
                identifier: identifier
            };
        } catch (error) {
            console.error('Upload error:', error);
            this.showUploadError('Upload failed. Please try again.');
            throw error;
        }
    }

    async uploadToArchive(file, identifier, metadata) {
        this.showUploadStatus('Uploading to Internet Archive...');

        // Create form data for the upload
        const formData = new FormData();
        formData.append('file', file);
        formData.append('identifier', identifier);
        formData.append('title', metadata.title);
        formData.append('description', `${metadata.mechanics}\n\nGoal: ${metadata.goal}`);
        formData.append('subject', metadata.tags.join(','));

        // Send to your backend endpoint that handles the Internet Archive upload
        const response = await fetch('/api/upload-to-archive', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('Failed to upload to Internet Archive');
        }

        return await response.json();
    }

    startProcessingCheck(identifier, metadata) {
        this.showUploadStatus('Processing video... This may take several minutes.');
        
        let checkCount = 0;
        const checkProcessing = async () => {
            try {
                const isProcessed = await this.checkProcessingStatus(identifier);
                
                if (isProcessed) {
                    this.processingComplete(identifier, metadata);
                    return;
                }

                checkCount++;
                if (checkCount >= this.maxProcessingChecks) {
                    this.showUploadError('Processing timeout. Please try again later.');
                    return;
                }

                // Schedule next check
                setTimeout(checkProcessing, this.checkInterval);
            } catch (error) {
                console.error('Error checking processing status:', error);
                this.showUploadError('Failed to check processing status. Please try again.');
            }
        };

        // Start checking
        checkProcessing();
    }

    async checkProcessingStatus(identifier) {
        const response = await fetch(`/api/check-processing?identifier=${identifier}`);
        if (!response.ok) {
            throw new Error('Failed to check processing status');
        }
        const data = await response.json();
        return data.isProcessed;
    }

    async processingComplete(identifier, metadata) {
        try {
            // Update moves.json with the new video
            const response = await fetch('/api/update-moves', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id: identifier,
                    ...metadata,
                    video_path: `https://archive.org/download/${identifier}/${identifier}.mp4`
                })
            });

            if (!response.ok) {
                throw new Error('Failed to update moves data');
            }

            this.showUploadSuccess('Upload complete! Your video has been added to the library.');
            
            // Reload moves data
            await fetch('/data/moves.json')
                .then(response => response.json())
                .then(data => {
                    movesData = data;
                    if (fuse) {
                        initializeSearch(movesData.moves);
                    }
                });
        } catch (error) {
            console.error('Error updating moves:', error);
            this.showUploadError('Failed to update library. Please try again.');
        }
    }

    showUploadStatus(message) {
        this.removeExistingStatus();
        const status = document.createElement('div');
        status.className = 'upload-status';
        status.innerHTML = `
            <div class="upload-status-content">
                <div class="upload-status-message">${message}</div>
                <div class="upload-status-progress"></div>
            </div>
        `;
        document.body.appendChild(status);
    }

    showUploadError(message) {
        this.removeExistingStatus();
        const status = document.createElement('div');
        status.className = 'upload-status';
        status.innerHTML = `
            <div class="upload-status-content">
                <div class="upload-status-message" style="color: #ff4444;">${message}</div>
            </div>
        `;
        document.body.appendChild(status);
        setTimeout(() => status.remove(), 5000);
    }

    showUploadSuccess(message) {
        this.removeExistingStatus();
        const status = document.createElement('div');
        status.className = 'upload-status';
        status.innerHTML = `
            <div class="upload-status-content">
                <div class="upload-status-message" style="color: #00e6e6;">${message}</div>
            </div>
        `;
        document.body.appendChild(status);
        setTimeout(() => status.remove(), 5000);
    }

    removeExistingStatus() {
        const existing = document.querySelector('.upload-status');
        if (existing) {
            existing.remove();
        }
    }
}

// Initialize the video manager
const videoManager = new VideoManager(); 