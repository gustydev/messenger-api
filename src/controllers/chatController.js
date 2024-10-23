const mongoose = require('mongoose')
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

// Populates chat with needed info of messages and members
const chatPop = [
    {
        path: 'messages',
        populate: {
            path: 'postedBy',
            select: 'displayName username profilePicUrl status postDate'
        }
    },
    {
        path: 'members',
        populate: {
            path: 'member',
            select: 'displayName username'
        }
    }
]


exports.getChats = asyncHandler(async function(req, res, next) {
    const chats = await Chat.find().populate({
        path: 'members',
        populate: {
            path: 'member',
            select: 'displayName'
        }
    });

    res.status(200).json(chats);
})

exports.getChatById = asyncHandler(async function(req, res, next) {
    const chat = await Chat.findById(req.params.chatId).populate(chatPop);    

    res.status(200).json(chat);
})

exports.getChatMessages = asyncHandler(async function(req, res, next) {
    const chat = await Chat.findById(req.params.chatId).select('messages').populate('messages');

    res.status(200).json(chat);
})

exports.getChatMembers = asyncHandler(async function(req, res, next) {
    const chat = await Chat.findById(req.params.chatId).select('members').populate(chatPop[1]);

    res.status(200).json(chat);
})

exports.getDMChat = asyncHandler(async function(req, res, next) {
    const [requester, recipient] = await Promise.all([
        User.findById(req.user.id),
        User.findById(req.params.recipientId)
    ])

    const dm = await Chat.findOne({
        dm: true,
        $and: [
            { 'members.member': requester },
            { 'members.member': recipient }
        ]
    })

    res.status(200).json(dm);
})

exports.newChat = [
    body('title')
    .if((value, {req}) => !req.body.dm) // Only validate title if chat is not a DM (dm is a falsy value, like undefined or false)
    .isString()
    .withMessage('Title must be a string')
    .trim()
    .isLength({min: 1})
    .withMessage('Chat must have a title')
    .isLength({max: 50})
    .withMessage('Chat title must have at most 50 characters'),

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

    body('dm')
    .optional()
    .isBoolean()
    .withMessage("The 'dm' field must be true or false if specified"),

    body('recipient')
    .if((value, {req}) => req.body.dm) // only validate if it's a dm
    .custom(async(value, {req}) => {
        const [creator, recipient] = await Promise.all([
            User.findById(req.user.id),
            User.findById(value),
        ])

        if (!recipient) {
            throw new Error('Could not find user to DM')
        }

        if (recipient._id.equals(creator._id)) {
            throw new Error('Cannot create a DM chat with yourself')
        }

        const dm = await Chat.findOne({
            dm: true,
            $and: [
                { 'members.member': creator },
                { 'members.member': recipient }
            ]
        })

        if (dm) {
            throw new Error(`DM between users ${creator.username} and ${recipient.username} already created`)
        }

        return true
    }),

    asyncHandler(async (req, res, next) => {
        const errors = validationResult(req)

        if (!errors.isEmpty()) {
            throw new ValidationError(errors.array());
        }

        const creator = await User.findById(req.user.id);

        const members = [{member: creator}];

        if (req.body.dm) {
            const recipient = await User.findById(req.body.recipient)
            members.push({member: recipient})
        } else {
            members[0].isAdmin = true; // admin status only makes sense for non-dm chats
        }

        const chat = new Chat({
            title: req.body.title,
            description: req.body.description,
            members,
            public: req.body.public,
            dm: req.body.dm
        })

        await chat.save();
        await chat.populate(chatPop[1]);

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

        const [chatToBeUpdated, user] = await Promise.all([
            Chat.findById(req.params.chatId),
            User.findById(req.user.id)
        ])

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
        }, {new: true}).populate(chatPop[1]);

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
    .withMessage('Max length of message: 250 characters')
    .custom((content, {req}) => {
        if (!req.file && content.length < 1) {
            throw new Error('Message must have text content or an attachment')
        }
        return true
    }),

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

        const poster = await User.findById(req.user.id);

        let fileUrl;
        let fileId;

        if (req.file) {
            if (req.file.size === 0) {
                const error = new Error('File is too small (O bytes)')
                error.statusCode = 500;
                throw error;
            }

            if (poster.demo) {
                throw new UnauthorizedError('Demo accounts cannot post attachments in chat')
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
            attachment: {
                url: fileUrl,
                type: req.file?.mimetype
            }
        })

        await msg.save();

        const chatToUpdate = await Chat.findById(req.params.chatId);
        
        const isMember = chatToUpdate.members.some((m) => m.member.equals(poster._id))
        if (!isMember) {
            if (chatToUpdate.dm) {
                throw new UnauthorizedError('You are not part of this DM')
            }
            chatToUpdate.members.push({member: poster, isAdmin: false})
        }

        chatToUpdate.messages.push(msg);

        const updated = await chatToUpdate.save()

        if (process.env.NODE_ENV !== 'test') {
            fileId = null;
        }

        const chat = await Chat.findById(updated._id).populate(chatPop);    

        return res.status(200).json({msg: 'Message posted', msg, chat, fileId})
    })
]   