const { ForbiddenError } = require("../utils/customErrors");
const User = require('../models/user');

async function checkIfDemo(req, res, next) {
    try {
        const user = await User.findById(req.user.id)

        if (user && user.demo) {
            return next(new ForbiddenError('Demo accounts cannot perform this action. Create a free account to do it!'))
        }
    
        next()
    } catch (error) {
        next(error)
    }
}

module.exports = { checkIfDemo }