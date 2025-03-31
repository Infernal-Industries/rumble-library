# Complete Setup Guide

This guide will walk you through setting up all required services for the Rumble Library application.

## 1. Internet Archive Setup

### Create an Account
1. Go to https://archive.org/account/signup
2. Fill in your email and choose a password
3. Verify your email address

### Get API Credentials
1. Go to https://archive.org/account/s3.php
2. Log in if prompted
3. Look for "S3-like Keys" section
4. Copy your:
   - Access Key
   - Secret Key

### Create Your Collection
1. Go to https://help.archive.org/help/collections-a-basic-guide/
2. Follow the instructions to create a collection

## 2. Firebase Setup

### Create Project
1. Go to https://console.firebase.google.com
2. Click "Create Project"
3. Enter project name: "Rumble Library"
4. Choose whether to enable Google Analytics (optional)
5. Click "Create Project"

### Enable Authentication
1. In Firebase Console, go to "Authentication" (left sidebar)
2. Click "Get Started"
3. Enable "Anonymous" authentication
   - Click "Anonymous" in the Sign-in providers list
   - Toggle the switch to enable it
   - Click "Save"

### Set Up Realtime Database
1. Go to "Realtime Database" (left sidebar)
2. Click "Create Database"
3. Choose region closest to your users
4. Start in test mode
5. Once created, go to "Rules" tab
6. Replace rules with:
   ```json
   {
     "rules": {
       "messages": {
         ".read": "auth != null",
         ".write": "auth != null",
         ".indexOn": ["timestamp"],
         "$messageId": {
           ".validate": "newData.hasChildren(['content', 'userId', 'timestamp']) &&
                        newData.child('content').isString() &&
                        newData.child('content').val().length <= 1000 &&
                        newData.child('userId').isString() &&
                        newData.child('timestamp').isNumber() &&
                        newData.child('timestamp').val() <= now"
         }
       },
       "users": {
         ".read": "auth != null",
         "$userId": {
           ".write": "auth != null && auth.uid === $userId",
           ".validate": "newData.hasChildren(['discordId', 'username']) &&
                        newData.child('discordId').isString() &&
                        newData.child('username').isString() &&
                        (!newData.child('email').exists() || newData.child('email').isString()) &&
                        (!newData.child('avatar').exists() || newData.child('avatar').isString()) &&
                        (!newData.child('discriminator').exists() || newData.child('discriminator').isString()) &&
                        (!newData.child('lastLogin').exists() || newData.child('lastLogin').isNumber())"
         }
       },
       "moves": {
         ".read": true,
         ".write": "auth != null",
         "$moveId": {
           ".validate": "newData.hasChildren(['title', 'notation', 'video_path']) &&
                        newData.child('title').isString() &&
                        newData.child('notation').hasChildren(['main']) &&
                        newData.child('video_path').isString() &&
                        (!newData.child('alternate_video_path').exists() || newData.child('alternate_video_path').isString()) &&
                        (!newData.child('mechanics').exists() || newData.child('mechanics').isString()) &&
                        (!newData.child('goal').exists() || newData.child('goal').isString()) &&
                        (!newData.child('tags').exists() || newData.child('tags').hasChildren())"
         }
       }
     }
   }
   ```
7. Click "Publish"

These rules provide:
- **Message Security**: 
  - Only authenticated users can read/write messages
  - Messages must have content, userId, and timestamp
  - Content length is limited to 1000 characters
  - Timestamp must be current or past

- **User Security**:
  - Users can only write to their own data
  - Required fields: discordId and username
  - Optional fields: email, avatar, discriminator, lastLogin
  - All fields are type-validated

- **Moves Security**:
  - Anyone can read moves
  - Only authenticated users can write moves
  - Required fields: title, notation (with main), video_path
  - Optional fields: alternate_video_path, mechanics, goal, tags

### Create Web App
1. Click the gear icon next to "Project Overview"
2. Click "Project settings"
3. In "Your apps" section, click web icon (</>)
4. Register app with nickname "Rumble Library Web"
5. Copy the firebaseConfig object

### Configure Security
1. Go to "Project Settings" > "Authentication" tab
2. Under "Authorized Domains", add your GitHub Pages domain:
   - Format: `yourusername.github.io`
3. Go to "Realtime Database" > "Rules" tab
4. Add your GitHub Pages domain to the authorized origins

## 3. Discord Setup

### Create Application
1. Go to https://discord.com/developers/applications
2. Click "New Application"
3. Name it "Rumble Library"
4. Save the changes

### Configure OAuth2
1. Click "OAuth2" in left sidebar
2. Add redirect URIs:
   - For local development: `http://localhost:3000/discord-callback.html`
   - For GitHub Pages: `https://yourusername.github.io/rumble-library/discord-callback.html`
3. Save Changes
4. Copy:
   - Client ID (under "Client Information")
   - Client Secret (click "Reset Secret" if needed)
5. Add OAuth2 scopes:
   - identify
   - email
6. Save Changes

## 4. GitHub Pages Setup

### Create Repository
1. Go to https://github.com/new
2. Name your repository `rumble-library`
3. Make it public
4. Initialize with a README
5. Click "Create repository"

### Configure GitHub Pages
1. Go to repository Settings
2. Navigate to "Pages" in the left sidebar
3. Under "Source", select:
   - Branch: `main`
   - Folder: `/ (root)`
4. Click "Save"
5. Note your site URL (will be `https://yourusername.github.io/rumble-library`)

### Update Base URL
1. Open `index.html` and update the base URL:
   ```html
   <base href="/rumble-library/">
   ```
2. Update all asset paths to be relative to the base URL

## 5. Environment Setup

1. In your project directory, copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and fill in all values:
   ```bash
   # Internet Archive credentials
   ARCHIVE_ACCESS_KEY=your_access_key_from_archive.org
   ARCHIVE_SECRET_KEY=your_secret_key_from_archive.org

   # Firebase configuration
   FIREBASE_API_KEY=from_firebase_web_app_config
   FIREBASE_AUTH_DOMAIN=from_firebase_web_app_config
   FIREBASE_DATABASE_URL=from_firebase_web_app_config
   FIREBASE_PROJECT_ID=from_firebase_web_app_config
   FIREBASE_STORAGE_BUCKET=from_firebase_web_app_config
   FIREBASE_MESSAGING_SENDER_ID=from_firebase_web_app_config
   FIREBASE_APP_ID=from_firebase_web_app_config

   # Discord configuration
   DISCORD_CLIENT_ID=from_discord_developer_portal
   DISCORD_CLIENT_SECRET=from_discord_developer_portal

   # Server configuration
   PORT=3000
   NODE_ENV=development
   ```

## 6. Local Development

1. Install Node.js if not already installed:
   ```bash
   brew install node
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## 7. Deployment

1. Build the project:
   ```bash
   npm run build
   ```

2. Push to GitHub:
   ```bash
   git add .
   git commit -m "Update site"
   git push origin main
   ```

3. Your site will be automatically deployed to:
   `https://yourusername.github.io/rumble-library`

## 8. Verification Steps

1. Open your GitHub Pages URL
2. Click "Sign in with Discord" - should open Discord OAuth window
3. After signing in, you should see your Discord avatar
4. Try uploading a video clip:
   - Should see upload progress
   - Should see processing status
   - Should appear in library when done
5. Try sending a chat message
6. Check Firebase Console to verify:
   - Anonymous user created in Authentication
   - Message stored in Realtime Database
7. Check Internet Archive to verify:
   - Video uploaded to your collection
   - Metadata correctly set

## Troubleshooting

### Discord Authentication Issues
- Verify redirect URIs match exactly (including the /rumble-library/ path)
- Check Discord Client ID and Secret are correct
- Verify CORS settings if getting cross-origin errors
- Check that your GitHub Pages domain is authorized in Firebase

### Upload Issues
- Check Internet Archive credentials
- Verify collection exists and is public
- Check file size limits

### GitHub Pages Issues
- Make sure all paths are relative to /rumble-library/
- Check that the base URL is set correctly
- Verify that the repository is public
- Check that GitHub Pages is enabled and building from the correct branch

### Firebase Issues
- Verify all config values match web app config
- Check Realtime Database rules are published
- Ensure your GitHub Pages domain is authorized

## Security Notes

1. Never commit `.env` file to git
2. Regularly rotate Discord Client Secret
3. Monitor Firebase usage for any unusual activity
4. Set up Firebase budget alerts
5. Regularly check Internet Archive uploads
6. Keep your repository public for GitHub Pages to work

Need more help? Check:
- Firebase Documentation: https://firebase.google.com/docs
- Internet Archive API Docs: https://archive.org/services/docs/api/
- Discord Developer Docs: https://discord.com/developers/docs
- GitHub Pages Docs: https://docs.github.com/pages 