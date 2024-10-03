const express = require('express');
const router = express.Router()
const controller = require('../controllers/chatController');

router.post('/new', controller.newChat)
router.post('/:chatId/message', controller.postMessage)

module.exports = router;