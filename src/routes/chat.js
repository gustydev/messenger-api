const express = require('express');
const router = express.Router()
const controller = require('../controllers/chatController');

router.get('/', controller.getChats) // get all chats
router.get('/:chatId', controller.getChatById) // get specific chat
router.get('/:chatId/messages', controller.getChatMessages) // get chat's messages
router.get('/:chatId/members', controller.getChatMembers) // get the chat's members

router.post('/:chatId/message', controller.postMessage)

router.put('/:chatId', controller.updateChat)
router.put('/:chatId/members') // update members list of chat (either adding or removing)

router.post('/', controller.newChat)

router.delete('/:chatId') // delete a chat by id

module.exports = router;