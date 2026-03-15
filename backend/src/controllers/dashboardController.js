const { getDashboard } = require('../services/dashboardService');

const getDashboardData = (req, res, next) => {
  try {
    const { type = 'all', period = 'all' } = req.query;
    const data = getDashboard({ type, period });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

module.exports = { getDashboardData };
