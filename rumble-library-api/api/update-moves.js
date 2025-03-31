const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

router.post('/api/update-moves', async (req, res) => {
    try {
        const moveData = req.body;
        
        // Validate move data
        if (!moveData.id || !moveData.title || !moveData.notation || !moveData.video_path) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Read current moves data
        const movesPath = path.join(process.cwd(), 'data', 'moves.json');
        let movesData;
        
        try {
            const fileContent = await fs.readFile(movesPath, 'utf8');
            movesData = JSON.parse(fileContent);
        } catch (error) {
            // If file doesn't exist, initialize with empty moves array
            movesData = { moves: [] };
        }

        // Add new move
        movesData.moves.push(moveData);

        // Write updated data
        await fs.writeFile(movesPath, JSON.stringify(movesData, null, 2));

        res.json({ success: true, move: moveData });
    } catch (error) {
        console.error('Update moves error:', error);
        res.status(500).json({ error: 'Failed to update moves data' });
    }
});

module.exports = router; 