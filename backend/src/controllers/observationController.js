const { submitObservation } = require('../services/observationService');

const postObservation = (req, res, next) => {
  try {
    const { id } = req.params;
    const result = submitObservation(id, req.body);
    res.status(201).json(result);
  } catch (err) {
    if (err && typeof err.status === 'number') {
      return res.status(err.status).json(err.body);
    }
    next(err);
  }
};

module.exports = { postObservation };
