const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    username: {type: String, required: true, minLength: 4, maxLength: 30, unique: true},
    password: {type: String, required: true, minLength: 8, maxLength: 50},
    email: {type: String, required: true, unique: true}, // validate with regex later
    displayName: {type: String, minLength: 4, maxLength: 30, default: function () {
        return this.username;
    }},
    joined: {type: Date, required: true, default: Date.now },
    lastSeen: {type: Date},
    profilePicUrl: {type: String},
    status: {type: String, required: true, default: 'Offline'},
    friends: [{type: Schema.Types.ObjectId, ref: 'User'}],
    bio: {type: String, minLength: 1, maxLength: 200},
    messages: [{type: Schema.Types.ObjectId, ref: 'Message'}]
})

module.exports = mongoose.model('User', UserSchema);