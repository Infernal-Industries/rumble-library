# Rumble Library

A library for fighting game moves and techniques, featuring video uploads to Internet Archive for permanent storage and Discord-based chat functionality.

## Important Security Notice

⚠️ **If you've cloned this repository before March 5, 2024:**
1. Rotate all your credentials immediately
2. Generate new API keys for all services
3. Update your configuration with the new credentials

## Setup

### Credentials Setup (Important!)

1. **Firebase Configuration**
   - Go to Firebase Console -> Project Settings -> Web App
   - Create a new web app if you haven't already
   - Copy the Firebase config object
   - Update values in `js/config.js`

2. **Discord Application**
   - Go to Discord Developer Portal
   - Create a new application or use existing one
   - Under OAuth2, add these redirect URIs:
     ```
     http://localhost:3000/discord-callback.html
     https://your-github-username.github.io/rumble-library/discord-callback.html
     ```
   - Copy Client ID and update in `js/config.js`
   - Generate a new Client Secret
   - Never commit the Client Secret to git

3. **Internet Archive**
   - Create an account at archive.org
   - Get your S3-like keys from https://archive.org/account/s3.php
   - Keep these keys secure and never commit them

### Environment Variables Setup
1. Copy `.env.example` to create your own `.env` file:
   ```bash
   cp .env.example .env
   ```
2. Fill in your credentials in `.env`:
   - Internet Archive credentials from your account
   - Firebase configuration from your Firebase Console
   - Discord Client ID and Secret from your Discord Developer Portal

Note: Never commit your `.env` file to git. It's automatically ignored via `.gitignore`.

### Internet Archive Setup
1. Create an Internet Archive account at https://archive.org/account/signup
2. Get your S3-like keys from https://archive.org/account/s3.php
3. Create a collection named "rumble-library" in your Internet Archive account

### Firebase Setup
1. Create a new Firebase project at https://console.firebase.google.com
2. Enable Authentication and select Discord as a sign-in provider
3. Enable Realtime Database and set up security rules
4. Create a web app in your project and copy the configuration
5. Install Firebase CLI: `npm install -g firebase-tools`
6. Initialize Firebase in your project: `firebase init`
   - Select Functions and Hosting
   - Choose your project
   - Use JavaScript for Functions
   - Set up ESLint
   - Install dependencies

### Discord Setup
1. Create a new application at https://discord.com/developers/applications
2. Go to OAuth2 settings and add your redirect URI:
   - For local development: `http://localhost:3000/discord-callback.html`
   - For production: `https://your-domain.com/discord-callback.html`
3. Copy your Client ID and Client Secret

## Environment Variables

Create a `.env` file in the root directory with:

```
# Internet Archive credentials
ARCHIVE_ACCESS_KEY=your_access_key
ARCHIVE_SECRET_KEY=your_secret_key

# Firebase configuration
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
FIREBASE_DATABASE_URL=https://your-app.firebaseio.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-app.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
FIREBASE_APP_ID=your-app-id

# Discord configuration
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
```

## Firebase Security Rules

Add these rules to your Realtime Database:

```json
{
  "rules": {
    "messages": {
      ".read": "auth != null",
      ".write": "auth != null",
      "$message": {
        ".validate": "newData.hasChildren(['content', 'userId', 'timestamp'])"
      }
    },
    "users": {
      "$uid": {
        ".read": "auth != null",
        ".write": "auth != null && auth.uid === $uid"
      }
    }
  }
}
```

## Security Best Practices

1. **Never commit sensitive data:**
   - `.env` files
   - Service account keys
   - API secrets
   - Private keys

2. **Credential Management:**
   - Rotate credentials regularly
   - Use different credentials for development and production
   - Revoke compromised credentials immediately

3. **Environment Variables:**
   - Use `.env` for local development
   - Use hosting platform's environment variables for production
   - Keep production credentials separate from development

4. **Access Control:**
   - Restrict Firebase Database access using security rules
   - Limit API permissions to only what's needed
   - Regularly audit access and permissions

5. **Monitoring:**
   - Monitor Firebase usage
   - Set up billing alerts
   - Watch for unusual activity

## Installation

1. Install root dependencies:
```bash
npm install
```

2. Install Firebase Functions dependencies:
```bash
cd functions
npm install
cd ..
```

3. Deploy Firebase Functions:
```bash
firebase deploy --only functions
```

4. Start the development server:
```bash
npm run dev
```

The server will start on http://localhost:3000

## Usage

### Video Upload
1. Click the upload button to select a video
2. Fill in the metadata form:
   - Title: Name of the move or technique
   - Notation: The input sequence
   - Mechanics: Description of the mechanics used
   - Goal: What the move achieves
   - Tags: Comma-separated tags for categorization

3. The video will be uploaded to Internet Archive and processed
   - You'll see status updates during the process
   - Processing can take several minutes
   - Once complete, the move will appear in the library

### Chat System
1. Click "Sign in with Discord" to authenticate
2. Once signed in, you can:
   - View the chat history
   - Send messages
   - See other users' Discord avatars and usernames

## Notes

- Videos are permanently stored on Internet Archive
- The upload process includes:
  1. Initial upload to Internet Archive
  2. Processing by Internet Archive (can take several minutes)
  3. Addition to the moves library once processing is complete
- The system will check processing status every 30 seconds
- Maximum wait time for processing is 1 hour
- Chat messages are stored in Firebase Realtime Database
- User authentication is handled through Discord OAuth2
- All uploaded videos are publicly accessible through Internet Archive
- All uploaded videos are publicly accessible through Internet Archive
