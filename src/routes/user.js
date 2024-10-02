const express = require('express');
const router = express.Router()
const controller = require('../controllers/userController');

router.get('/', function(req, res) {
    res.json({msg: 'user get'})
})

router.post('/register', controller.userRegister);

router.post('/login', controller.userLogin)

module.exports = router;