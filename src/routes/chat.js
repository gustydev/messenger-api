const express = require('express');
const router = express.Router()
const controller = require('../controllers/chatController');

router.post('/new', controller.newChat)

module.exports = router;