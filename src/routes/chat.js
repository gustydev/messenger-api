const express = require('express');
const router = express.Router()
const controller = require('../controllers/chatController');

router.get('/list', controller.getChats)
router.get('/:chatId', controller.getChatById)
router.get('/:chatId/messages', controller.getChatMessages)
router.get('/:chatId/members', controller.getChatMembers)
router.get('/dm/:recipientId', controller.getDMChat)

router.post('/:chatId/message', controller.postMessage)

router.put('/:chatId', controller.updateChat)
router.put('/:chatId/members') // update members list of chat (either adding or removing)

router.post('/', controller.newChat)

router.delete('/:chatId') // delete a chat by id

module.exports = router;