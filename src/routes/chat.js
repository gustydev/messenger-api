const express = require('express');
const router = express.Router()
const controller = require('../controllers/chatController');
const { validateToken } = require('../middlewares/validateToken')
const { checkIfDemo } = require('../middlewares/checkIfDemo');

router.get('/list', validateToken, controller.getChats)
router.get('/:chatId', validateToken, controller.getChatById)
router.get('/:chatId/messages', validateToken, controller.getChatMessages)
router.get('/:chatId/members', validateToken, controller.getChatMembers)
router.get('/dm/:recipientId', validateToken, controller.getDMChat)

router.post('/:chatId/message', validateToken, controller.postMessage) 
// the checkifdemo middleware is not used here because the message may not have an attachment

router.put('/:chatId', validateToken, controller.updateChat)
router.put('/:chatId/members') // update members list of chat (either adding or removing)

router.post('/', validateToken, checkIfDemo, controller.newChat)

router.delete('/:chatId') // delete a chat by id

module.exports = router;