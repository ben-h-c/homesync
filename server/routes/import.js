const express = require('express');
const router = express.Router();
const { buildPreview } = require('../services/csvProcessor');

// POST /api/import/preview — parse CSV and return preview with suggested mappings
router.post('/preview', (req, res) => {
  try {
    const { csvText } = req.body;
    if (!csvText) return res.status(400).json({ error: 'csvText is required' });
    const preview = buildPreview(csvText);
    res.json(preview);
  } catch (err) {
    res.status(400).json({ error: 'Failed to parse CSV: ' + err.message });
  }
});

module.exports = router;
