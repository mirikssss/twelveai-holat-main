const express = require('express');
const { postVerification } = require('../controllers/verificationController');
const { postObservation } = require('../controllers/observationController');

const router = express.Router();

router.post('/:id/verifications', postVerification);
router.post('/:id/observations', postObservation);

module.exports = router;
