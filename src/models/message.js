const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MessageSchema = new Schema({
    content: {type: String, maxLength: 250},
    attachmentUrl: {type: String},
    postedBy: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    readBy: [{type: Schema.Types.ObjectId, ref: 'User'}],
    postDate: {type: Date, default: Date.now},
    editDate: {type: Date},
    chat: {type: Schema.Types.ObjectId, ref: 'Chat', required: true}
})

MessageSchema.pre('validate', function(next) {
    if (!this.attachmentUrl && this.content.length < 1) {
        const error = new Error("Message must have text content or an attachment")
        error.statusCode = 400;
        return next(error)
    }
    next()
})

module.exports = mongoose.model('Message', MessageSchema);