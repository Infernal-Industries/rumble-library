// Your web app's Firebase configuration
// TODO: Replace with your actual Firebase config from the Firebase Console
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "your-app.firebaseapp.com",
    databaseURL: "https://your-app.firebaseio.com",
    projectId: "your-project-id",
    storageBucket: "your-app.appspot.com",
    messagingSenderId: "your-messaging-sender-id",
    appId: "your-app-id"
};

// Discord OAuth2 Configuration
// TODO: Replace with your Discord application credentials
const DISCORD_CLIENT_ID = 'YOUR_DISCORD_CLIENT_ID';
const DISCORD_REDIRECT_URI = window.location.origin + '/discord-callback.html';

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get references to services
const auth = firebase.auth();
const database = firebase.database();

// Handle authentication state changes
auth.onAuthStateChanged((user) => {
    if (user) {
        console.log('User is signed in:', user.displayName);
        setupChat(user);
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
    // Discord OAuth2 URL
    const scope = 'identify email';
    const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(DISCORD_REDIRECT_URI)}&response_type=code&scope=${encodeURIComponent(scope)}`;
    
    // Open Discord auth in a popup
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
            // Exchange code for Firebase custom token
            const response = await fetch('/api/discord-auth', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ code }),
            });
            
            const { firebaseToken, discordUser } = await response.json();
            
            // Sign in to Firebase with custom token
            await auth.signInWithCustomToken(firebaseToken);
            
            // Store Discord user info
            const userRef = database.ref(`users/${auth.currentUser.uid}`);
            await userRef.update({
                discordId: discordUser.id,
                username: discordUser.username,
                discriminator: discordUser.discriminator,
                avatar: discordUser.avatar,
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