const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Message = require('./message');
const Chat = require('./chat')

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
    demo: {type: Boolean, default: false}
}, { collation: { locale: 'en_US', strength: 1 } }) // case insensitive unique indexes

UserSchema.index({ username: 1 });

UserSchema.pre('findOneAndDelete', async function(next) {
    try {
        const filter = this.getFilter(); // Filter = {_id: userId} (basically what is passed on the delete function)
        const userId = filter._id;

        await Message.deleteMany({ postedBy: userId }) 
        // upon deleting an user, also delete all of their messages

        await Chat.deleteMany({ dm: true, 'members.member': userId}) 
        // and any dm's they have with other users

        await Chat.updateMany({'members.member': userId}, {$pull: {members: {member: userId}}}) 
        // as well as removing them from any member list they were in

        next()
    } catch (err) {
        next(err)
    }
});

module.exports = mongoose.model('User', UserSchema);