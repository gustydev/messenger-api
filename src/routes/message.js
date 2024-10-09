const express = require('express');
const router = express.Router()
const controller = require('../controllers/messageController');

// all of these require authorization
router.get('/list')
router.get('/:messageId')
router.delete('/:messageId')

module.exports = router;