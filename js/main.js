// Search weights configuration
const MATCH_WEIGHTS = {
    EXACT_TITLE: 100,
    PARTIAL_TITLE: 80,
    EXACT_NOTATION: 70,
    EXACT_TAG: 60,
    FUZZY_TITLE: 40,
    FUZZY_NOTATION: 30,
    FUZZY_TAG: 20
};

// Load moves data
let movesData = { moves: [] };
let currentMove = null;

// Get base URL for assets
function getBaseUrl() {
    const baseTag = document.querySelector('base');
    return baseTag ? baseTag.href : '/';
}

// Get move ID from URL or default to first move
function getMoveIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('move');
}

// Update URL with current move
function updateUrl(moveId, updateHistory = true) {
    const url = new URL(window.location);
    url.searchParams.set('move', moveId);
    if (updateHistory) {
        window.history.pushState({ moveId }, '', url);
    } else {
        window.history.replaceState({ moveId }, '', url);
    }
}

// Handle browser back/forward
window.addEventListener('popstate', (event) => {
    const moveId = getMoveIdFromUrl();
    
    if (moveId) {
        // Navigate to a move page
        const move = movesData.moves.find(m => m.id === moveId);
        if (move) {
            currentMove = move;
            document.body.classList.remove('landing-page');
            document.querySelector('.layout-container').style.display = 'grid';
            updatePageContent(move);
            setupNotationDropdown();
        }
    } else {
        // Navigate to landing page
        document.body.classList.add('landing-page');
        document.querySelector('.layout-container').style.display = 'none';
        initializeLandingPage();
    }
});

// Load moves data with better error handling
async function loadMovesData() {
    try {
        const baseUrl = getBaseUrl();
        const response = await fetch(`${baseUrl}data/moves.json`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        console.log('Successfully fetched moves.json');
        const data = await response.json();
        console.log('Successfully parsed moves.json:', data);
        return data;
    } catch (error) {
        console.error('Error loading moves data:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack
        });
        throw error;
    }
}

// Setup notation dropdown
function setupNotationDropdown() {
    const trigger = document.querySelector('.notation-dropdown-trigger');
    const menu = document.querySelector('.notation-dropdown-menu');
    const copyButton = menu.querySelector('button:first-child');
    const shareButton = menu.querySelector('button:last-child');

    if (trigger && menu) {
        trigger.addEventListener('click', () => {
            menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!trigger.contains(e.target) && !menu.contains(e.target)) {
                menu.style.display = 'none';
            }
        });

        // Copy notation
        if (copyButton) {
            copyButton.addEventListener('click', () => {
                const notation = currentMove.notation.main;
                navigator.clipboard.writeText(notation).then(() => {
                    copyButton.textContent = 'Copied!';
                    setTimeout(() => {
                        copyButton.textContent = 'Copy Notation';
                    }, 2000);
                });
            });
        }

        // Share move
        if (shareButton) {
            shareButton.addEventListener('click', () => {
                const url = new URL(window.location);
                url.searchParams.set('move', currentMove.id);
                navigator.clipboard.writeText(url.toString()).then(() => {
                    shareButton.textContent = 'Copied!';
                    setTimeout(() => {
                        shareButton.textContent = 'Share';
                    }, 2000);
                });
            });
        }
    }
}

// Setup home button
function setupHomeButton() {
    const homeButton = document.querySelector('.home-button');
    if (homeButton) {
        homeButton.addEventListener('click', () => {
            window.history.pushState({}, '', '/');
            document.body.classList.add('landing-page');
            document.querySelector('.layout-container').style.display = 'none';
            initializeLandingPage();
        });
    }
}

// Initialize the application
async function initializeApp() {
    try {
        movesData = await loadMovesData();
        
        // Get move ID from URL
        const moveId = getMoveIdFromUrl();
        
        if (moveId) {
            // If we have a move ID, show the move page
            currentMove = movesData.moves.find(m => m.id === moveId);
            if (!currentMove && movesData.moves.length > 0) {
                currentMove = movesData.moves[0];
            }
            if (currentMove) {
                updateUrl(currentMove.id, false);
                document.body.classList.remove('landing-page');
                document.querySelector('.layout-container').style.display = 'grid';
                updatePageContent(currentMove);
                setupNotationDropdown();
                setupHomeButton();
            }
        } else {
            // If no move ID, show the landing page
            document.body.classList.add('landing-page');
            document.querySelector('.layout-container').style.display = 'none';
            initializeLandingPage();
        }
    } catch (error) {
        console.error('Failed to initialize app:', error);
        alert('Failed to load moves data. Please try refreshing the page.');
    }
}

// Start the application
initializeApp();

// Update page content with move data
function updatePageContent(move) {
    const baseUrl = getBaseUrl();
    
    // Update title
    document.querySelector('.move-title').textContent = move.title.toUpperCase();
    
    // Update tags
    const tagsContainer = document.querySelector('.tags-container');
    tagsContainer.innerHTML = '';
    
    // Add predefined tags (Charge, Flow)
    if (move.properties) {
        if (move.properties.includes('charge')) {
            const chargeTag = document.createElement('button');
            chargeTag.className = 'tag charge';
            chargeTag.textContent = 'Charge';
            tagsContainer.appendChild(chargeTag);
        }
        if (move.properties.includes('flow')) {
            const flowTag = document.createElement('button');
            flowTag.className = 'tag flow';
            flowTag.textContent = 'Flow';
            tagsContainer.appendChild(flowTag);
        }
    }
    
    // Add custom tags
    move.tags.forEach(tag => {
        const tagButton = document.createElement('button');
        tagButton.className = 'tag';
        tagButton.textContent = tag;
        tagButton.addEventListener('click', () => {
            const searchInput = document.querySelector('.search-input');
            searchInput.value = tag;
            searchInput.dispatchEvent(new Event('input'));
        });
        tagsContainer.appendChild(tagButton);
    });
    
    // Update move information
    const moveInfo = document.querySelector('.move-info p');
    moveInfo.innerHTML = `
        <strong>Mechanics Used:</strong> ${move.mechanics}<br><br>
        <strong>Goal Achieved:</strong> ${move.goal}<br><br>
        <strong>Notation:</strong> ${move.notation.main}<br>
        ${move.notation.notes.map(note => `<em>${note}</em>`).join('<br>')}
    `;
    
    // Update main video
    const mainVideo = document.querySelector('.clip-box video source');
    mainVideo.src = `${baseUrl}${move.video_path}`;
    mainVideo.parentElement.load();

    // Handle alternate video if available
    const alternateClipBox = document.querySelector('.clip-box:nth-child(2)');
    if (move.alternate_video_path) {
        alternateClipBox.style.display = 'block';
        const alternateVideo = alternateClipBox.querySelector('video source');
        alternateVideo.src = `${baseUrl}${move.alternate_video_path}`;
        alternateVideo.parentElement.load();
    } else {
        alternateClipBox.style.display = 'none';
    }

    // Update community clips
    updateCommunityClips(move);
}

// Update community clips section
function updateCommunityClips(move) {
    const communityClipsGrid = document.querySelector('.community-clips-grid');
    communityClipsGrid.innerHTML = '';

    if (move.community_clips && move.community_clips.length > 0) {
        move.community_clips.forEach((clip, index) => {
            const clipElement = document.createElement('div');
            clipElement.className = 'community-clip';
            clipElement.innerHTML = `
                <video loop muted playsinline>
                    <source src="${getBaseUrl()}${clip.video_path}" type="video/mp4">
                </video>
                <div class="community-clip-title">Community Clip ${index + 1}</div>
            `;
            
            // Add hover play/pause functionality
            const video = clipElement.querySelector('video');
            clipElement.addEventListener('mouseenter', () => video.play());
            clipElement.addEventListener('mouseleave', () => {
                video.pause();
                video.currentTime = 0;
            });
            
            communityClipsGrid.appendChild(clipElement);
        });
    }
}

// Initialize landing page
function initializeLandingPage() {
    const searchInput = document.querySelector('.landing-search-input');
    const searchResults = document.querySelector('.landing-search-results');
    
    if (searchInput && searchResults) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            if (query.length > 0) {
                const fuse = new Fuse(movesData.moves, {
                    keys: ['title', 'notation.main', 'tags'],
                    threshold: 0.3
                });
                
                const results = fuse.search(query);
                searchResults.innerHTML = results.map(result => `
                    <div class="search-result" onclick="window.location.href='?move=${result.item.id}'">
                        <h3>${result.item.title}</h3>
                        <p>${result.item.notation.main}</p>
                    </div>
                `).join('');
            } else {
                searchResults.innerHTML = '';
            }
        });
    }
}

// Rest of the code remains unchanged... 