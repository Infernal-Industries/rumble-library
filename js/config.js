// Base configuration
const config = {
    baseUrl: '/rumble-library',
    firebase: {
        // These values should be replaced with your Firebase config
        // They are public values and safe to commit
        apiKey: "YOUR-API-KEY", // Replace with your Firebase API key
        authDomain: "your-app.firebaseapp.com",
        databaseURL: "https://your-app.firebaseio.com",
        projectId: "your-project-id",
        storageBucket: "your-app.appspot.com",
        messagingSenderId: "your-sender-id",
        appId: "your-app-id"
    },
    discord: {
        clientId: "YOUR-CLIENT-ID", // Replace with your Discord Client ID
        redirectUri: window.location.hostname === "localhost" 
            ? "http://localhost:3000/discord-callback.html"
            : `https://${window.location.hostname}/rumble-library/discord-callback.html`
    }
};

// Export the configuration
window.appConfig = config; 