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
            const searchResults = document.querySelector('.search-results');
            if (searchInput && searchResults) {
                searchInput.focus();
                searchInput.value = tagButton.textContent;
                const inputEvent = new Event('input', {
                    bubbles: true,
                    cancelable: true
                });
                setTimeout(() => {
                    searchInput.dispatchEvent(inputEvent);
                }, 0);
            }
        });
    });
    
    // Update notation block
    const notationBlock = document.querySelector('.notation-block');
    notationBlock.innerHTML = `
        Notation: ${move.notation.main}<br>
        ${move.notation.notes.map(note => note).join('<br>')}
        <div class="notation-dropdown-trigger"></div>
        <div class="notation-dropdown-menu">
            <button>Copy Notation</button>
            <button>Share</button>
        </div>
    `;
    
    // Update move description
    const moveDescription = document.querySelector('.move-description');
    moveDescription.innerHTML = `
        Move Name: ${move.title}<br><br>
        Mechanics Used: ${move.mechanics}<br><br>
        Goal Achieved: ${move.goal}
    `;
    
    // Update main video with correct base URL
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
}

// Rest of the code remains unchanged... 