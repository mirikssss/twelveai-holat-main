const express = require('express');
const { getObjects, getObjectById, getMeta } = require('../controllers/mapController');

const router = express.Router();

router.get('/objects', getObjects);
router.get('/objects/:id', getObjectById);
router.get('/meta', getMeta);

module.exports = router;

