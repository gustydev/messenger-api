const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MessageSchema = new Schema({
    content: {type: String, required: function() {
        // text content is only required if message has no attachment
        if (this.attachmentUrl) {
            return false 
        }
        return true
    }, maxLength: 200, minLength: 1},
    attachmentUrl: {type: String},
    postedBy: {type: Schema.Types.ObjectId, ref: 'User'},
    readBy: [{type: Schema.Types.ObjectId, ref: 'User'}],
    postDate: {type: Date, default: Date.now},
    editDate: {type: Date},
    // chat: {type: Schema.Types.ObjectId, ref: 'Chat'}
})

module.exports = mongoose.model('Message', MessageSchema);