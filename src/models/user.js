const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    username: {type: String, required: true, minLength: 4, maxLength: 30, unique: true},
    password: {type: String, required: true, minLength: 8},
    displayName: {type: String, minLength: 2, maxLength: 30, default: function () {
        return this.username;
    }}, 
    joined: {type: Date, required: true, default: Date.now },
    lastSeen: {type: Date},
    profilePicUrl: {type: String},
    status: {type: String, required: true, default: 'Offline'},
    bio: {type: String, minLength: 1, maxLength: 200},
    messages: [{type: Schema.Types.ObjectId, ref: 'Message'}],
    demo: {type: Boolean, default: false}
}, { collation: { locale: 'en_US', strength: 1 } }) // case insensitive unique indexes

UserSchema.index({ username: 1 });

UserSchema.pre('remove', async function(next) {
    // upon deleting an user, also delete all of their messages
    await Message.deleteMany({ postedBy: this._id });
    next();
});

module.exports = mongoose.model('User', UserSchema);