const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const { body, validationResult } = require('express-validator');
const asyncHandler = require('express-async-handler');
const Chat = require('../models/chat');
const User = require('../models/user')

exports.newChat = [
    body('title')
    .trim()
    .isLength({min: 1, max: 50})
    .withMessage('Chat must have a title of 50 characters maximum'),

    body('description')
    .optional()
    .isLength({min: 1, max: 200})
    .withMessage('Description has a limit of 200 characters'),

    body('public')
    .optional()
    .isBoolean()
    .withMessage('Chat public status must be true or false'),

    asyncHandler(async (req, res, next) => {
        const errors = validationResult(req)

        if (!errors.isEmpty()) {
            return res.status(400).json(errors)
        }

        try {
            const token = req.headers['authorization'].split(' ')[1];
            const decoded = jwt.verify(token, process.env.SECRET);
            const creator = await User.findById(decoded.id);

            const chat = new Chat({
                title: req.body.title,
                description: req.body.description,
                members: [creator],
                public: req.body.public
            })

            await chat.save();
            return res.status(200).json({msg: 'Chat created', chat})
        } catch (err) {
            console.error(err)
        }
    })
]