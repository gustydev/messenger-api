require('dotenv').config()
const { InvalidTokenError } = require("../utils/customErrors");
const jwt = require('jsonwebtoken')

function validateToken(req, res, next) {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
        throw new InvalidTokenError()
    }

    jwt.verify(token, process.env.SECRET, (err, user) => {
        if (err) {
            throw new InvalidTokenError()
        }
        req.user = user; // attach decoded user info to the request
        next();
    });
}

module.exports = { validateToken }