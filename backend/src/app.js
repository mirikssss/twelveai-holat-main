const express = require('express');
const cors = require('cors');
const path = require('path');

const mapRoutes = require('./routes/mapRoutes');

const createApp = () => {
  const app = express();

  app.use(cors());
  app.use(express.json());

  const publicDir = path.resolve(__dirname, '..', 'public');
  app.use(express.static(publicDir));

  app.get('/api/health', (req, res) => {
    res.json({ ok: true });
  });

  app.use('/api/map', mapRoutes);

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

