// Initialize Firebase with configuration from config.js
firebase.initializeApp(window.appConfig.firebase);

// Get references to services
const auth = firebase.auth();
const database = firebase.database();

// Handle authentication state changes
auth.onAuthStateChanged((user) => {
    if (user) {
        console.log('User is signed in:', user);
        const userRef = database.ref(`users/${user.uid}`);
        userRef.once('value').then((snapshot) => {
            const userData = snapshot.val();
            if (userData) {
                setupChat(userData);
            }
        });
    } else {
        console.log('No user is signed in');
        showSignInButton();
    }
});

// Show sign in button
function showSignInButton() {
    const discussionSection = document.querySelector('.discussion-messages');
    if (discussionSection) {
        discussionSection.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <button onclick="signInWithDiscord()" class="sign-in-button">
                    <img src="https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0a6a49cf127bf92de1e2_icon_clyde_white_RGB.png" 
                         alt="Discord Logo" 
                         style="height: 20px; vertical-align: middle; margin-right: 8px;">
                    Sign in with Discord
                </button>
            </div>
        `;
    }
}

// Sign in with Discord
function signInWithDiscord() {
    const scope = 'identify email';
    const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${window.appConfig.discord.clientId}&redirect_uri=${encodeURIComponent(window.appConfig.discord.redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}`;
    
    const width = 500;
    const height = 800;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    
    window.open(
        discordAuthUrl,
        'discord-oauth',
        `width=${width},height=${height},left=${left},top=${top}`
    );
}

// Handle Discord callback
window.addEventListener('message', async (event) => {
    if (event.origin !== window.location.origin) return;
    
    if (event.data.type === 'DISCORD_AUTH_SUCCESS') {
        const { code } = event.data;
        try {
            // Exchange code for Discord access token
            const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    client_id: window.appConfig.discord.clientId,
                    client_secret: window.appConfig.discord.clientSecret,
                    grant_type: 'authorization_code',
                    code: code,
                    redirect_uri: window.appConfig.discord.redirectUri
                })
            });

            if (!tokenResponse.ok) {
                throw new Error('Failed to get Discord access token');
            }

            const tokenData = await tokenResponse.json();

            // Get Discord user info
            const userResponse = await fetch('https://discord.com/api/users/@me', {
                headers: {
                    Authorization: `Bearer ${tokenData.access_token}`
                }
            });

            if (!userResponse.ok) {
                throw new Error('Failed to get Discord user info');
            }

            const discordUser = await userResponse.json();

            // Sign in to Firebase anonymously
            const { user } = await auth.signInAnonymously();
            
            // Store Discord user info
            const userRef = database.ref(`users/${user.uid}`);
            await userRef.update({
                discordId: discordUser.id,
                username: discordUser.username,
                discriminator: discordUser.discriminator,
                avatar: discordUser.avatar,
                email: discordUser.email,
                lastLogin: Date.now()
            });
            
        } catch (error) {
            console.error('Error signing in with Discord:', error);
            alert('Failed to sign in with Discord. Please try again.');
        }
    }
});

// Setup chat functionality
function setupChat(user) {
    const messagesRef = database.ref('messages');
    const discussionSection = document.querySelector('.discussion-messages');
    const textarea = document.querySelector('.message-input textarea');

    // Get Discord user info
    database.ref(`users/${user.uid}`).once('value', (snapshot) => {
        const userInfo = snapshot.val();
        if (!userInfo) return;

        // Clear previous messages
        discussionSection.innerHTML = '';

        // Listen for new messages
        messagesRef.on('child_added', (snapshot) => {
            const message = snapshot.val();
            const messageElement = document.createElement('div');
            messageElement.className = 'message';
            
            // Get sender's Discord info
            database.ref(`users/${message.userId}`).once('value', (userSnapshot) => {
                const sender = userSnapshot.val();
                const avatarUrl = sender?.avatar ? 
                    `https://cdn.discordapp.com/avatars/${sender.discordId}/${sender.avatar}.png` :
                    'https://cdn.discordapp.com/embed/avatars/0.png';
                
                messageElement.innerHTML = `
                    <div class="message-header">
                        <div class="user-info">
                            <img src="${avatarUrl}" alt="Avatar" class="user-avatar">
                            <span class="username">${sender?.username || 'Unknown User'}</span>
                        </div>
                        <span class="timestamp">${new Date(message.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div class="message-content">${message.content}</div>
                `;
                
                discussionSection.appendChild(messageElement);
                discussionSection.scrollTop = discussionSection.scrollHeight;
            });
        });

        // Handle sending messages
        if (textarea) {
            textarea.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    const content = textarea.value.trim();
                    if (content) {
                        messagesRef.push({
                            content: content,
                            userId: user.uid,
                            timestamp: Date.now()
                        });
                        textarea.value = '';
                    }
                }
            });
        }
    });
} 