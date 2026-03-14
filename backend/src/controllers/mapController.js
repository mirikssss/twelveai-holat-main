const { getMapObjects, getMapObjectById, getMapMeta } = require('../services/mapService');

const parseNumber = (value) => {
  if (value === undefined) return undefined;
  const num = Number(value);
  return Number.isNaN(num) ? undefined : num;
};

const getObjects = (req, res, next) => {
  try {
    const { q, type = 'all', status = 'all', lat, lng, radius } = req.query;

    const result = getMapObjects({
      q,
      type,
      status,
      lat: parseNumber(lat),
      lng: parseNumber(lng),
      radius: parseNumber(radius),
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
};

const getObjectByIdHandler = (req, res, next) => {
  try {
    const { id } = req.params;
    const obj = getMapObjectById(id);

    if (!obj) {
      return res.status(404).json({ error: 'Object not found' });
    }

    res.json(obj);
  } catch (err) {
    next(err);
  }
};

const getMeta = (req, res, next) => {
  try {
    const meta = getMapMeta();
    res.json(meta);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getObjects,
  getObjectById: getObjectByIdHandler,
  getMeta,
};

