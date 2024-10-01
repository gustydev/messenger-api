const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { body, validationResult } = require('express-validator');
const asyncHandler = require('express-async-handler');
const User = require('../models/user')

exports.userRegister = [
    body('username')
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
        return true
    }),

    body('email')
    .trim()
    .matches(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/)
    .withMessage('Invalid email')
    .custom(async (value) => {
        const email = await User.findOne({email: value});
        if (email) {
            throw new Error('Email already in use')
        }
        return true
    }),

    body('password')
    .trim()
    .isLength({min: 8})
    .withMessage('Password must be at least 8 characters long'),

    body('displayName')
    .trim()
    .optional() // if not given in body, is set to the username
    .isLength({min: 2, max: 30})
    .withMessage('Display name must be between 2 and 30 characters'),

    asyncHandler(async (req, res, next) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json(errors)
        }

        try {
            const hashedPass = await bcrypt.hash(req.body.password, 10)

            const user = new User({
                username: req.body.username,
                password: hashedPass,
                email: req.body.email,
                displayName: req.body.displayName || undefined
            });

            await user.save();

            return res.status(200).json({msg: 'User created successfully', user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                displayName: user.displayName,
            }})
        } catch (error) {
            return res.status(400).json(error)
        }
    })
]