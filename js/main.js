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
    // For local development server
    if (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost') {
        return '/';
    }
    // For production (GitHub Pages)
    const baseTag = document.querySelector('base');
    return baseTag ? baseTag.href : window.location.pathname.replace(/\/[^/]*$/, '/');
}

// Get move ID from URL or default to first move
function getMoveIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('move');
}

// Update URL with current move
function updateUrl(moveId, updateHistory = true) {
    const url = new URL(window.location.href);
    url.searchParams.set('move', moveId);
    if (updateHistory) {
        window.history.pushState({ moveId }, '', url.toString());
    } else {
        window.history.replaceState({ moveId }, '', url.toString());
    }
}

// Handle browser back/forward
window.addEventListener('popstate', (event) => {
    const moveId = getMoveIdFromUrl();
    
    if (moveId) {
        const move = movesData.moves.find(m => m.id === moveId);
        if (move) {
            currentMove = move;
            document.body.classList.remove('landing-page');
            document.querySelector('.landing-container').style.display = 'none';
            document.querySelector('.layout-container').style.display = 'grid';
            updatePageContent(move);
            setupNotationDropdown();
            setupHomeButton(); // Make sure home button is set up
        }
    } else {
        document.body.classList.add('landing-page');
        document.querySelector('.landing-container').style.display = 'flex';
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
            window.history.pushState({}, '', window.location.pathname);
            document.body.classList.add('landing-page');
            document.querySelector('.landing-container').style.display = 'flex';
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
            const move = movesData.moves.find(m => m.id === moveId);
            if (move) {
                currentMove = move;
                document.body.classList.remove('landing-page');
                document.querySelector('.landing-container').style.display = 'none';
                document.querySelector('.layout-container').style.display = 'grid';
                updateUrl(moveId, false); // Use false to not add to history on initial load
                updatePageContent(move);
                setupNotationDropdown();
                setupHomeButton(); // Make sure home button is set up
            } else {
                // If move not found, go to landing page
                document.body.classList.add('landing-page');
                document.querySelector('.landing-container').style.display = 'flex';
                document.querySelector('.layout-container').style.display = 'none';
                initializeLandingPage();
            }
        } else {
            // If no move ID, show the landing page
            document.body.classList.add('landing-page');
            document.querySelector('.landing-container').style.display = 'flex';
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

// Update video paths to use relative paths
function updatePageContent(move) {
    const baseUrl = getBaseUrl();
    
    // Update title
    document.querySelector('.title').textContent = move.title;
    
    // Update username
    document.querySelector('.posted-by .username').textContent = move.username;
    
    // Update tags
    const tagsContainer = document.querySelector('.tags-container');
    tagsContainer.innerHTML = move.tags.map(tag => 
        `<button class="tag ${tag.toLowerCase()}">${tag}</button>`
    ).join('');
    
    // Add click handlers for tags
    tagsContainer.querySelectorAll('.tag').forEach(tagButton => {
        tagButton.addEventListener('click', () => {
            const searchInput = document.querySelector('.search-input');
            if (searchInput) {
                searchInput.focus();
                searchInput.value = tagButton.textContent;
                const inputEvent = new Event('input', {
                    bubbles: true,
                    cancelable: true
                });
                searchInput.dispatchEvent(inputEvent);
            }
        });
    });
    
    // Update move details
    const moveDetails = document.querySelector('.move-details');
    if (moveDetails) {
        moveDetails.querySelector('.move-name span').textContent = move.title;
        moveDetails.querySelector('.mechanics span').textContent = move.mechanics;
        moveDetails.querySelector('.goal span').textContent = move.goal;
    }
    
    // Update main video with correct base URL
    const mainVideo = document.querySelector('.clip-box video source');
    if (mainVideo) {
        mainVideo.src = `${baseUrl}${move.video_path}`;
        mainVideo.parentElement.load();
    }

    // Handle alternate video if available
    const alternateClipBox = document.querySelector('.clip-box:nth-child(2)');
    if (alternateClipBox) {
        if (move.alternate_video_path) {
            alternateClipBox.style.display = 'block';
            const alternateVideo = alternateClipBox.querySelector('video source');
            alternateVideo.src = `${baseUrl}${move.alternate_video_path}`;
            alternateVideo.parentElement.load();
        } else {
            alternateClipBox.style.display = 'none';
        }
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
                    <div class="search-result" onclick="handleMoveSelect('${result.item.id}')">
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

// Handle move selection
function handleMoveSelect(moveId) {
    const move = movesData.moves.find(m => m.id === moveId);
    if (move) {
        currentMove = move;
        document.body.classList.remove('landing-page');
        document.querySelector('.landing-container').style.display = 'none';
        document.querySelector('.layout-container').style.display = 'grid';
        updateUrl(moveId, true);
        updatePageContent(move);
        setupNotationDropdown();
        setupHomeButton(); // Make sure home button is set up
    }
}

// Add this to the window object so it can be called from onclick
window.handleMoveSelect = handleMoveSelect;

// Rest of the code remains unchanged... 