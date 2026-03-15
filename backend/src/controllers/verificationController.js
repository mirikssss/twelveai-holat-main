const { submitVerification } = require('../services/verificationService');

const postVerification = (req, res, next) => {
  try {
    const { id } = req.params;
    const result = submitVerification(id, req.body);
    res.status(201).json(result);
  } catch (err) {
    if (err && typeof err.status === 'number') {
      return res.status(err.status).json(err.body);
    }
    next(err);
  }
};

module.exports = { postVerification };
