const express = require('express');
const router = express.Router()
const controller = require('../controllers/userController');
const { validateToken } = require('../middlewares/validateToken');
const { checkIfDemo } = require('../middlewares/checkIfDemo')

router.get('/', function(req, res) {
    res.json({msg: 'user get'})
})

router.get('/list', controller.getUsersList)
router.get('/:userId', controller.getUserDetails)
router.get('/:userId/friends') // get user friends

router.post('/register', controller.userRegister);

router.post('/login', controller.userLogin)

router.put('/:userId', validateToken, checkIfDemo, controller.userUpdate) // update user details
router.put('/:userId/friends') // update user friend list

router.delete('/:userId') // delete an user

module.exports = router;