const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ChatSchema = new Schema({
    title: {type: String, required: true, minLength: 1, maxLength: 50},
    description: {type: String, minLength: 1, maxLength: 200},
    members: [{type: Schema.Types.ObjectId, ref: 'User', required: true}],
    messages: [{type: Schema.Types.ObjectId, ref: 'Message'}],
    created: {type: Date, default: Date.now},
    pictureUrl: {type: String},
    public: {type: Boolean, default: false}
})

module.exports = mongoose.model('Chat', ChatSchema)