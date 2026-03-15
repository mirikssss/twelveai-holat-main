const { getUserObservations } = require('../services/userObservationService');

const getUserObs = (req, res, next) => {
  try {
    const { phone } = req.params;
    if (!phone) {
      return res.status(400).json({ error: 'Phone required' });
    }
    const observations = getUserObservations(phone);
    res.json(observations);
  } catch (err) {
    next(err);
  }
};

module.exports = { getUserObs };
