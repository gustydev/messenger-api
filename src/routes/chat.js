const express = require('express');
const router = express.Router()
const controller = require('../controllers/chatController');

router.post('/:chatId/message', controller.postMessage)

router.put('/:chatId', controller.updateChat)

router.post('/', controller.newChat)

module.exports = router;