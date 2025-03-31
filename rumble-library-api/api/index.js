const express = require('express');
const cors = require('cors');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// Initialize express
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Import route handlers
const uploadToArchive = require('./upload-to-archive');
const checkProcessing = require('./check-processing');
const updateMoves = require('./update-moves');

// Use routes
app.use(uploadToArchive);
app.use(checkProcessing);
app.use(updateMoves);

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Export the express app
module.exports = app; 