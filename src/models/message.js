const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MessageSchema = new Schema({
    content: {type: String, maxLength: 250},
    attachment: {
        url: {type: String},
        type: {type: String}
        // might possibly need "size" as well, and "original name"
    },
    postedBy: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    postDate: {type: Date, default: Date.now},
    chat: {type: Schema.Types.ObjectId, ref: 'Chat', required: true}
})

MessageSchema.pre('validate', function(next) {
    if (!this.attachment.url && this.content.length < 1) {
        const error = new Error("Message must have text content or an attachment")
        error.statusCode = 400;
        return next(error)
    }
    next()
})

module.exports = mongoose.model('Message', MessageSchema);