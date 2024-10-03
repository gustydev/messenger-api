const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const { body, param, validationResult } = require('express-validator');
const asyncHandler = require('express-async-handler');
const Chat = require('../models/chat');
const User = require('../models/user')
const Message = require('../models/message')

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
            res.status(400).json(err)
        }
    })
]

exports.postMessage = [
    body('content')
    .isLength({max: 250})
    .withMessage('Max length of message: 250 characters'),

    param('chatId')
    .custom(async (value) => {
        const chat = await Chat.findById(value);
        if (!chat) { throw new Error('Chat not found')}
    }),

    asyncHandler(async function(req, res, next) {
        const errors = validationResult(req)

        if (!errors.isEmpty()) {
            return res.status(400).json(errors)
        }

        try {
            const token = req.headers['authorization'].split(' ')[1];
            const decoded = jwt.verify(token, process.env.SECRET);
            const poster = await User.findById(decoded.id);

            const msg = new Message({
                content: req.body.content,
                chat: await Chat.findById(req.params.chatId),
                postedBy: poster
            })

            await msg.save();

            return res.status(200).json({msg: 'Message posted', msg})
        } catch (err) {
            console.error(err)
            res.status(400).json(err);
        }
    })
]