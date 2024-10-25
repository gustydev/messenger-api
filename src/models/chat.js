const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Message = require('./message');

const ChatSchema = new Schema({
    title: {type: String, required: function() {
        return !this.dm // If chat is a DM, title is optional, and vice versa
    }, minLength: 1, maxLength: 50},
    description: {type: String, minLength: 1, maxLength: 200},
    members: [{
        member: {type: Schema.Types.ObjectId, ref: 'User', required: true},
        isAdmin: {type: Boolean}
    }],
    messages: [{type: Schema.Types.ObjectId, ref: 'Message'}],
    created: {type: Date, default: Date.now},
    public: {type: Boolean, default: false},
    dm: {type: Boolean, default: false}
})

ChatSchema.index({ 'members.member': 1 });

ChatSchema.pre('deleteMany', async function(next) {
    // Refers to the "deleteMany" to delete all of user's dm's
    // When deleting just one chat, should also do the same thing (if later added)
    try {
        const filter = this.getFilter();
        const chatId = filter._id;

        // upon deleting a chat, also delete all of its messages
        await Message.deleteMany({ chat: chatId });

        next()
    } catch (err) {
        next(err);
    }
});

module.exports = mongoose.model('Chat', ChatSchema)