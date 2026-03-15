const express = require('express');
const cors = require('cors');
const path = require('path');

const mapRoutes = require('./routes/mapRoutes');
const verificationRoutes = require('./routes/verificationRoutes');
const { getUserObs } = require('./controllers/userController');

const createApp = () => {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  const publicDir = path.resolve(__dirname, '..', 'public');
  app.use(express.static(publicDir));

  app.get('/', (req, res) => {
    res.json({ name: 'Holat API', status: 'ok', endpoints: ['/api/health', '/api/map/objects', '/api/map/objects/:id'] });
  });

  app.get('/api/health', (req, res) => {
    res.json({ ok: true });
  });

  app.use('/api/map', mapRoutes);
  app.use('/api/objects', verificationRoutes);
  app.get('/api/users/:phone/observations', getUserObs);

  // simple error handler
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    // In hackathon mode we just log and return generic error
    // but avoid crashing the process.
    // eslint-disable-next-line no-console
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
};

module.exports = { createApp };

