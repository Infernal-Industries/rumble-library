// Base URL for GitHub Pages
const BASE_URL = '/rumble-library';

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

// Update fetch path to use base URL
fetch(`${BASE_URL}/data/moves.json`)
    .then(response => response.json())
    .then(data => {
        movesData = data;
        console.log('Loaded moves data:', movesData); // Debug log
        
        // Get move ID from URL
        const moveId = getMoveIdFromUrl();
        
        if (moveId) {
            // If we have a move ID, show the move page
            currentMove = data.moves.find(m => m.id === moveId);
            if (!currentMove && data.moves.length > 0) {
                currentMove = data.moves[0];
            }
            if (currentMove) {
                updateUrl(currentMove.id, false);
            }
            document.body.classList.remove('landing-page');
            document.querySelector('.layout-container').style.display = 'grid';
            initializeApp();
        } else {
            // If no move ID, show the landing page
            document.body.classList.add('landing-page');
            document.querySelector('.layout-container').style.display = 'none';
            initializeLandingPage();
        }
    })
    .catch(error => {
        console.error('Error loading moves data:', error);
        // Show error message to user
        alert('Failed to load moves data. Please try refreshing the page.');
    });

// Update video paths to use base URL
function updatePageContent(move) {
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
    
    // Update main video with base URL
    const mainVideo = document.querySelector('.clip-box video source');
    mainVideo.src = `${BASE_URL}${move.video_path}`;
    mainVideo.parentElement.load();

    // Handle alternate video if available
    const alternateClipBox = document.querySelector('.clip-box:nth-child(2)');
    if (move.alternate_video_path) {
        alternateClipBox.style.display = 'block';
        const alternateVideo = alternateClipBox.querySelector('video source');
        alternateVideo.src = `${BASE_URL}${move.alternate_video_path}`;
        alternateVideo.parentElement.load();
    } else {
        alternateClipBox.style.display = 'none';
    }
}

// Rest of the code remains unchanged... 