const express = require('express');
const router = express.Router()
const controller = require('../controllers/userController');

router.get('/', function(req, res) {
    res.json({msg: 'user get'})
})

router.get('/list', controller.getUsersList) // lists all users
router.get('/:userId') // get user details
router.get('/:userId/friends') // get user friends

router.post('/register', controller.userRegister);

router.post('/login', controller.userLogin)

router.put('/:userId', controller.userUpdate) // update user details
router.put('/:userId/friends') // update user friend list

router.delete('/:userId') // delete an user

module.exports = router;