require('dotenv').config();
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { body, validationResult } = require('express-validator');
const asyncHandler = require('express-async-handler');
const User = require('../models/user')
const { UnauthorizedError, ValidationError, InvalidTokenError } = require('../utils/customErrors.js')
const multer = require('multer');
const upload = multer({storage: multer.memoryStorage(), limits: {fileSize: 3 * 1024 * 1024}})
const cloudinary = require('cloudinary').v2;
cloudinary.config({
    secure: true
});

exports.getUsersList = asyncHandler(async (req, res, next) => {
    const users = await User.find();

    return res.status(200).json(users);
})

exports.getUserDetails = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.params.userId)

    return res.status(200).json(user)
})

exports.userRegister = [
    body('username')
    .isString()
    .withMessage('Username must be a string')
    .trim()
    .isLength({min: 4, max: 30})
    .withMessage('Username must be between 4 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username must have only alphanumeric characters (letters and numbers) and underscores')
    .custom(async (value) => {
        const user = await User.findOne({username: value})
        if (user) {
            throw new Error('Username already taken')
        } 
    }),

    body('password')
    .isString()
    .withMessage('Password must be a string')
    .trim()
    .isLength({min: 8})
    .withMessage('Password must be at least 8 characters long'),

    body('confirmPassword')
    .trim()
    .custom((value, {req}) => {
        if (value === req.body.password) {
            return true;
        }
        throw new Error('Passwords do not match')
    }),

    body('displayName')
    .optional({values: 'falsy'}) // considers falsy values optional (includes empty strings like "")
    .isString()
    .withMessage('Display name must be a string')
    .trim()
    .isLength({min: 2, max: 30})
    .withMessage('Display name must be between 2 and 30 characters'),

    body('demo')
    .optional()
    .isBoolean()
    .withMessage('Demo must be set as true or false if provided'),

    asyncHandler(async (req, res, next) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            throw new ValidationError(errors.array());
        }

        const hashedPass = await bcrypt.hash(req.body.password, 10)

        const user = new User({
            username: req.body.username,
            password: hashedPass,
            displayName: req.body.displayName || undefined,
            demo: req.body.demo
        });

        await user.save();

        return res.status(200).json({msg: 'User created successfully', user: {
            _id: user._id,
            username: user.username,
            displayName: user.displayName,
        }})
    })
]

exports.userLogin = [
    body('username')
    .isString()
    .withMessage('Username must be a string')
    .trim()
    .custom(async (value) => {
        const user = await User.findOne({username: value})
        if (!user) {
            throw new Error("User not found")
        }
    }),

    body('password')
    .isString()
    .withMessage('Password must be a string')
    .isLength({min: 8})
    .withMessage('Password must be at least 8 characters long')
    .custom(async (value, {req}) => {
        const user = await User.findOne({username: req.body.username})
        if (!user) {
            return false;
        }

        const match = await bcrypt.compare(value, user.password);

        if (!match) { throw new Error('Incorrect password, please try again.')}
    }),

    asyncHandler(async (req, res, next) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            throw new ValidationError(errors.array());
        }

        const user = await User.findOne({username: req.body.username}).select('-password');
        const token = jwt.sign({id: user._id}, process.env.SECRET, {expiresIn: '3d'});
        
        return res.status(200).json({
            msg: `Logged in succesfully! Token expires in 3 days`,
            token,
            user
        })
    })
];

exports.userUpdate = [
    upload.single('pic'),
    
    body('displayName')
    .optional({values: 'falsy'}) // considers empty string as optional
    .isString()
    .withMessage('Display name must be a string')
    .trim()
    .isLength({min: 2, max: 30})
    .withMessage('Display name must be between 2 and 30 characters'),

    body('bio')
    .optional()
    .isString()
    .withMessage('Bio must be a string')
    .trim()
    .isLength({max: 200})
    .withMessage('Bio has a limit of 200 characters'),

    asyncHandler(async function(req, res, next) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new ValidationError(errors.array());
        }

        const userToBeEdited = await User.findById(req.params.userId);

        if (!userToBeEdited._id.equals(req.user.id)) {
            throw new UnauthorizedError('Cannot update someone else\'s profile')
        }

        let imgUrl;
        let imgId;

        if (req.file) {
            if (!req.file.mimetype.startsWith('image/')) {
                const error = new Error('Cannot upload non-image as a profile picture')
                error.statusCode = 400;
                throw error;
            }

            if (req.file.size === 0) {
                const error = new Error('File is too small (O bytes)')
                error.statusCode = 500;
                throw error;
            }

            await new Promise((resolve) => {
                cloudinary.uploader.upload_stream({resource_type: 'image'}, (error, result) => {
                    return resolve(result)
                }).end(req.file.buffer)
            }).then(result => {
                console.log('Buffer uplodaded: ', result.public_id)
                imgUrl = result.secure_url
                imgId = result.public_id
            })
        }

        const user = await User.findByIdAndUpdate(req.params.userId, {
            bio: req.body.bio,
            displayName: req.body.displayName || userToBeEdited.username,
            profilePicUrl: imgUrl
        }, {new: true})

        if (process.env.NODE_ENV !== 'test') {
            // Only need the imgId for deleting images from cloud after tests
            imgId = null;
        }
        
        return res.status(200).json({msg: 'Profile updated!', user, imgId})
    })
]