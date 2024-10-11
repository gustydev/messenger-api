const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const { body, param, validationResult } = require('express-validator');
const asyncHandler = require('express-async-handler');
const Chat = require('../models/chat');
const User = require('../models/user')
const Message = require('../models/message')
const { ValidationError, UnauthorizedError, NotFoundError, InvalidTokenError } = require('../utils/customErrors');
const multer = require('multer')
const upload = multer({storage: multer.memoryStorage(), limits: {fileSize: 3 * 1024 * 1024}})
const cloudinary = require('cloudinary').v2;
cloudinary.config({
    secure: true
});

exports.getChats = asyncHandler(async function(req, res, next) {
    const chats = await Chat.find();

    res.status(200).json(chats);
})

exports.getChatById = asyncHandler(async function(req, res, next) {
    const chat = await Chat.findById(req.params.chatId).populate({
        path: 'messages',
        populate: {
            path: 'postedBy',
            select: 'displayName'
        }
    });

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
            throw new ValidationError(errors.array());
        }

        let decoded;
        try {
            const token = req.headers['authorization'].split(' ')[1];
            decoded = jwt.verify(token, process.env.SECRET); 
        } catch (error) {
            throw new InvalidTokenError()
        }

        const creator = await User.findById(decoded.id);

        const chat = new Chat({
            title: req.body.title,
            description: req.body.description,
            members: [{member: creator, isAdmin: true}],
            public: req.body.public
        })

        await chat.save();
        return res.status(200).json({msg: 'Chat created', chat})
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
    .withMessage('Chat public status must be a boolean (true or false)'),

    asyncHandler(async function(req, res, next) {
        const errors = validationResult(req)

        if (!errors.isEmpty()) {
            throw new ValidationError(errors.array());
        }

        let decoded;
        try {
            const token = req.headers['authorization'].split(' ')[1];
            decoded = jwt.verify(token, process.env.SECRET); 
            // decodes jwt of who sent request (may not be an admin or even in the chat)
        } catch (error) {
            throw new InvalidTokenError()
        }

        const chatToBeUpdated = await Chat.findById(req.params.chatId);
        const user = await User.findById(decoded.id)

        const userInChat = chatToBeUpdated.members.find((m) => m.member.equals(user._id));

        if (!userInChat || !userInChat.isAdmin) {
            // Reject put request if user is not in chat or is not an admin
            throw new UnauthorizedError('User is not in chat or is not a chat admin');
        }

        const { title, description, public: isPublic } = req.body;

        const chat = await Chat.findByIdAndUpdate(req.params.chatId, {
            title: title,
            description: description,
            public: isPublic
        }, {new: true})

        return res.status(200).json({msg: 'Chat updated', chat})
    })
]

exports.postMessage = [
    upload.single('attachment'),
    
    body('content')
    .isString()
    .withMessage('Message must be a string')
    .trim()
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
            throw new ValidationError(errors.array());
        }

        let decoded;
        try {
            const token = req.headers['authorization'].split(' ')[1];
            decoded = jwt.verify(token, process.env.SECRET); 
        } catch (error) {
            throw new InvalidTokenError()
        }

        const poster = await User.findById(decoded.id);

        let fileUrl;
        let fileId;

        if (req.file) {
            if (req.file.size === 0) {
                const error = new Error('File is too small (O bytes)')
                error.statusCode = 500;
                throw error;
            }
            
            await new Promise((resolve) => {
                cloudinary.uploader.upload_stream({resource_type: 'auto'}, (error, result) => {
                    return resolve(result)
                }).end(req.file.buffer)
            }).then(result => {
                console.log('Buffer uplodaded: ', result.public_id)
                fileUrl = result.secure_url
                fileId = result.public_id
            })
        }

        const msg = new Message({
            content: req.body.content,
            chat: await Chat.findById(req.params.chatId),
            postedBy: poster,
            attachmentUrl: fileUrl
        })

        await msg.save();
        await Chat.findByIdAndUpdate(req.params.chatId, {
            $push: {
                messages: msg
            }
        })

        if (process.env.NODE_ENV !== 'test') {
            fileId = null;
        }

        return res.status(200).json({msg: 'Message posted', msg, fileId})
    })
]   