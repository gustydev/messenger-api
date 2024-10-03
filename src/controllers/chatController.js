const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const { body, param, validationResult } = require('express-validator');
const asyncHandler = require('express-async-handler');
const Chat = require('../models/chat');
const User = require('../models/user')
const Message = require('../models/message')

exports.getChats = asyncHandler(async function(req, res, next) {
    const chats = await Chat.find();

    res.status(200).json(chats);
})

exports.getChatById = asyncHandler(async function(req, res, next) {
    const chat = await Chat.findById(req.params.chatId);

    res.status(200).json(chat);
})

exports.getChatMessages = asyncHandler(async function(req, res, next) {
    const chat = await Chat.findById(req.params.chatId).select('messages').populate('messages');

    res.status(200).json(chat);
})

exports.getChatMembers = asyncHandler(async function(req, res, next) {
    const chat = await Chat.findById(req.params.chatId).select('members').populate('members.member');

    res.status(200).json(chat);
})

exports.newChat = [
    body('title')
    .isString()
    .withMessage('Title must be a string')
    .trim()
    .isLength({min: 1, max: 50})
    .withMessage('Chat must have a title of 50 characters maximum'),

    body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string')
    .trim()
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
                members: [{member: creator, isAdmin: true}],
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

exports.updateChat = [
    body('title')
    .optional()
    .isString()
    .withMessage('Title must be a string')
    .trim()
    .isLength({min: 1, max: 50})
    .withMessage('Chat must have a title of 50 characters maximum'),

    body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string')
    .trim()
    .isLength({min: 1, max: 200})
    .withMessage('Description has a limit of 200 characters'),

    body('public')
    .optional()
    .isBoolean()
    .withMessage('Chat public status must be true or false'),

    asyncHandler(async function(req, res, next) {
        const errors = validationResult(req)

        if (!errors.isEmpty()) {
            return res.status(400).json(errors)
        }

        try {
            const token = req.headers['authorization'].split(' ')[1];
            const decoded = jwt.verify(token, process.env.SECRET); 
            // decodes the jwt of who requested the update (not necessarily an admin or even in the chat)

            const chat = await Chat.findById(req.params.chatId);
            const user = await User.findById(decoded.id)

            const userInChat = chat.members.find((m) => m.member.equals(user._id));

            if (!userInChat || !userInChat.isAdmin) {
                // Reject put request if user is not in chat or is not an admin
                return res.status(401).json({msg: 'Unauthorized'})
            }

            const { title, description, public: isPublic } = req.body;

            chat.title = title || chat.title;
            chat.description = description || chat.description;
            chat.public = isPublic || chat.public;

            await chat.save();

            return res.status(200).json({msg: 'Chat updated', chat})
            
        } catch (err) {
            console.error(err)
            res.status(400).json(err)
        }
    })
]

exports.postMessage = [
    body('content')
    .isString()
    .withMessage('Message must be a string')
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
                // i'll work on attachments later
            })

            await msg.save();

            return res.status(200).json({msg: 'Message posted', msg})
        } catch (err) {
            console.error(err)
            return res.status(400).json(err);
        }
    })
]   