const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: 'http://localhost:5173' }));
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

app.listen(PORT, () => {
  console.log(`HomeSync server running on http://localhost:${PORT}`);
});
