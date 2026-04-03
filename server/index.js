const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'HomeSync API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/properties', require('./routes/properties'));
app.use('/api/subdivisions', require('./routes/subdivisions'));
app.use('/api/import', require('./routes/import'));
app.use('/api/maintenance', require('./routes/maintenance'));
app.use('/api/contacts', require('./routes/contacts'));
app.use('/api/activities', require('./routes/activities'));
app.use('/api/emails', require('./routes/emails'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/reports', require('./routes/reports'));

// In production, serve the built React app
const clientDist = path.resolve(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get('*', (req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`HomeSync server running on http://localhost:${PORT}`);
});
