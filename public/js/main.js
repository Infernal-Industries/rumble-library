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

fetch('/data/moves.json')
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
                // First focus the search input
                searchInput.focus();
                // Then set its value
                searchInput.value = tagButton.textContent;
                // Create and dispatch an input event
                const inputEvent = new Event('input', {
                    bubbles: true,
                    cancelable: true
                });
                // Dispatch the event after a small delay to ensure the value is set
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
    
    // Update main video
    const mainVideo = document.querySelector('.clip-box video source');
    mainVideo.src = move.video_path;
    mainVideo.parentElement.load(); // Reload video with new source

    // Handle alternate video if available
    const alternateClipBox = document.querySelector('.clip-box:nth-child(2)');
    if (move.alternate_video_path) {
        alternateClipBox.style.display = 'block';
        const alternateVideo = alternateClipBox.querySelector('video source');
        alternateVideo.src = move.alternate_video_path;
        alternateVideo.parentElement.load();
    } else {
        alternateClipBox.style.display = 'none';
    }
}

function initializeApp() {
    // Update initial content if we have a move
    if (currentMove) {
        updatePageContent(currentMove);
    }

    // Setup all other functionality
    setupTextarea();
    setupNotationDropdown();
    setupCommunityClips();
    
    // Initialize search for main page
    setupSearch(false);

    // Setup home button
    const homeButton = document.querySelector('.home-button');
    if (homeButton) {
        homeButton.addEventListener('click', () => {
            // Remove move ID from URL
            const url = new URL(window.location);
            url.searchParams.delete('move');
            window.history.pushState({}, '', url);
            
            // Show landing page
            document.body.classList.add('landing-page');
            document.querySelector('.layout-container').style.display = 'none';
            initializeLandingPage();
        });
    }
}

function initializeLandingPage() {
    // Hide the layout container
    const layoutContainer = document.querySelector('.layout-container');
    if (layoutContainer) {
        layoutContainer.style.display = 'none';
    }

    // Remove any existing landing container
    const existingLanding = document.querySelector('.landing-container');
    if (existingLanding) {
        existingLanding.remove();
    }

    // Create landing page HTML
    const landingContainer = document.createElement('div');
    landingContainer.className = 'landing-container';
    landingContainer.innerHTML = `
        <h1 class="landing-title">THE RUMBLE LIBRARY</h1>
        <h2 class="landing-subtitle">Search for moves, combos, and techniques</h2>
        <div class="landing-search-container">
            <input type="text" class="landing-search-input" placeholder="Start typing to search...">
            <div class="landing-search-results"></div>
        </div>
    `;

    // Add landing page content
    document.body.appendChild(landingContainer);

    // Initialize search for landing page
    setupSearch(true);
    
    // Focus the search input
    const searchInput = document.querySelector('.landing-search-input');
    if (searchInput) {
        searchInput.focus();
    }
}

// Split out textarea setup into its own function
function setupTextarea() {
    const textarea = document.querySelector('.message-input textarea');
    if (!textarea) return;
    
    function adjustHeight() {
        textarea.style.height = '0';
        const height = textarea.scrollHeight - 4;
        textarea.style.height = height + 'px';
    }
    
    textarea.addEventListener('input', adjustHeight);
    textarea.addEventListener('change', adjustHeight);
    adjustHeight();
}

// Split out community clips setup into its own function
function setupCommunityClips() {
    document.querySelectorAll('.community-clip-thumbnail').forEach(thumbnail => {
        const video = thumbnail.querySelector('video');
        if (!video) return;
        
        video.currentTime = 0;
        
        video.addEventListener('loadedmetadata', () => {
            video.currentTime = 0.01;
        });

        video.addEventListener('seeked', () => {
            video.pause();
        });

        video.addEventListener('ended', () => {
            thumbnail.classList.remove('playing');
            video.currentTime = 0.01;
        });

        video.load();

        thumbnail.addEventListener('click', () => {
            document.querySelectorAll('.community-clip-thumbnail').forEach(other => {
                if (other !== thumbnail) {
                    const otherVideo = other.querySelector('video');
                    if (otherVideo && !otherVideo.paused) {
                        otherVideo.pause();
                        other.classList.remove('playing');
                    }
                }
            });

            if (video.paused) {
                video.play().then(() => {
                    thumbnail.classList.add('playing');
                }).catch(error => {
                    console.error('Error playing video:', error);
                });
            } else {
                video.pause();
                thumbnail.classList.remove('playing');
                video.currentTime = 0.01;
            }
        });
    });
}

function setupNotationDropdown() {
    const dropdownTrigger = document.querySelector('.notation-dropdown-trigger');
    const dropdownMenu = document.querySelector('.notation-dropdown-menu');

    dropdownTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownTrigger.classList.toggle('active');
        dropdownMenu.classList.toggle('show');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!dropdownMenu.contains(e.target) && !dropdownTrigger.contains(e.target)) {
            dropdownTrigger.classList.remove('active');
            dropdownMenu.classList.remove('show');
        }
    });
}

// Search functionality
let fuse = null;

function normalizeNotation(notation) {
    // Remove numbers, lowercase modifiers, and special characters
    // but preserve case of main characters
    return notation.replace(/[1-9tmh._!]/g, '');
}

function initializeSearch(moves) {
    // Prepare moves data with normalized notations
    const movesWithNormalizedNotation = moves.map(move => ({
        ...move,
        normalizedNotation: normalizeNotation(move.notation.main)
    }));

    const options = {
        includeScore: true,
        threshold: 0.3,
        ignoreLocation: true,
        keys: [
            {
                name: 'notation.main',
                weight: 2,
                getFn: (obj) => obj.notation.main,
                caseSensitive: true  // Keep case sensitivity for exact matches
            },
            {
                name: 'normalizedNotation',
                weight: 1.8,  // Slightly lower than exact match
                caseSensitive: true
            },
            {
                name: 'title',
                weight: 1.5
            },
            {
                name: 'tags',
                weight: 1
            }
        ],
        shouldSort: true,
        findAllMatches: true,
        minMatchCharLength: 1
    };
    
    fuse = new Fuse(movesWithNormalizedNotation, options);
}

function searchMoves(query, moves) {
    if (!fuse) {
        initializeSearch(moves);
    }

    // Search with both original and normalized queries
    const originalResults = fuse.search(query);
    const normalizedQuery = normalizeNotation(query);
    const normalizedResults = normalizedQuery !== query ? fuse.search(normalizedQuery) : [];

    // Combine and deduplicate results
    const combinedResults = [...originalResults];
    normalizedResults.forEach(normalizedResult => {
        if (!combinedResults.some(r => r.item.id === normalizedResult.item.id)) {
            combinedResults.push(normalizedResult);
        }
    });

    return combinedResults
        .sort((a, b) => {
            // Prioritize exact notation matches
            const aExactMatch = a.item.notation.main === query;
            const bExactMatch = b.item.notation.main === query;
            if (aExactMatch && !bExactMatch) return -1;
            if (!aExactMatch && bExactMatch) return 1;
            
            // Then sort by score
            return a.score - b.score;
        })
        .map(result => ({
            move: result.item,
            score: 1 - result.score
        }));
}

function setupSearch(isLandingPage = false) {
    console.log('Setting up search for', isLandingPage ? 'landing page' : 'main page');
    
    const searchInput = isLandingPage 
        ? document.querySelector('.landing-search-input')
        : document.querySelector('.search-input');
    
    const searchResults = isLandingPage
        ? document.querySelector('.landing-search-results')
        : document.querySelector('.search-results');

    console.log('Search elements:', { searchInput, searchResults });

    if (!searchInput || !searchResults) {
        console.error('Search elements not found');
        return;
    }

    // Initialize Fuse.js
    if (!fuse) {
        initializeSearch(movesData.moves);
    }

    // Remove any existing listeners
    const newSearchInput = searchInput.cloneNode(true);
    searchInput.parentNode.replaceChild(newSearchInput, searchInput);

    newSearchInput.addEventListener('input', (e) => {
        console.log('Search input event:', e.target.value);
        const query = e.target.value.trim();
        
        if (query.length === 0) {
            searchResults.classList.remove('show');
            return;
        }

        const results = searchMoves(query, movesData.moves);
        console.log('Search results:', results);
        
        if (results.length > 0) {
            searchResults.innerHTML = results.map(({ move }) => `
                <div class="search-result-item" data-move-id="${move.id}">
                    <div class="search-result-title">${move.title}</div>
                    <div class="search-result-notation">${move.notation.main}</div>
                    <div class="search-result-tags">
                        ${move.tags.map(tag => `
                            <span class="search-result-tag">${tag}</span>
                        `).join('')}
                    </div>
                </div>
            `).join('');
            
            searchResults.classList.add('show');
            
            // Add click handlers for search results
            searchResults.querySelectorAll('.search-result-item').forEach(item => {
                item.addEventListener('click', () => {
                    const moveId = item.dataset.moveId;
                    const selectedMove = movesData.moves.find(m => m.id === moveId);
                    
                    if (selectedMove) {
                        currentMove = selectedMove;
                        if (isLandingPage) {
                            // Redirect to move page
                            document.body.classList.remove('landing-page');
                            updateUrl(moveId);
                            window.location.reload();
                        } else {
                            // Update current page
                            updatePageContent(selectedMove);
                            updateUrl(moveId);
                        }
                        
                        // Clear search
                        newSearchInput.value = '';
                        searchResults.classList.remove('show');
                    }
                });
            });
        } else {
            searchResults.innerHTML = '<div class="search-result-item">No results found</div>';
            searchResults.classList.add('show');
        }
    });

    // Close search results when clicking outside
    document.addEventListener('click', (e) => {
        if (!newSearchInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.classList.remove('show');
        }
    });

    // Prevent clicks within search results from bubbling
    searchResults.addEventListener('click', (e) => {
        e.stopPropagation();
    });
} 