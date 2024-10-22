const express = require('express');
const router = express.Router()
const controller = require('../controllers/chatController');
const { validateToken } = require('../middlewares/validateToken')

router.get('/list', controller.getChats)
router.get('/:chatId', controller.getChatById)
router.get('/:chatId/messages', controller.getChatMessages)
router.get('/:chatId/members', controller.getChatMembers)
router.get('/dm/:recipientId', validateToken, controller.getDMChat)

router.post('/:chatId/message', validateToken, controller.postMessage)

router.put('/:chatId', validateToken, controller.updateChat)
router.put('/:chatId/members') // update members list of chat (either adding or removing)

router.post('/', validateToken, controller.newChat)

router.delete('/:chatId') // delete a chat by id

module.exports = router;