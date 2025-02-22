const { connectDB, disconnectDB, clearDB } = require('./setup');
const { userRegister, userLogin, postMessage, postWithAttachment, createChat } = require('./requests');

const cloudinary = require('cloudinary').v2;
cloudinary.config({
    secure: true
});

const User = require('../src/models/user');
const Chat = require('../src/models/chat');
const Message = require('../src/models/message');

let authorization;
let chat;
const fileIds = []; // array of uploaded file id's to be cleared after tests

beforeAll(async () => {
    await connectDB();
    await clearDB(User);
    await clearDB(Chat);
    await clearDB(Message)

    await userRegister({
        username: 'test',
        password: '12345678',
        confirmPassword: '12345678'
    }, 200)

    const res = await userLogin({ username: 'test', password: '12345678' }, 200)

    authorization = `Bearer ${res.body.token}`;

    const res2 = await createChat({title: 'Test Chat'}, 200, authorization)

    chat = res2.body.chat;
});

afterAll(async () => {
    // need to delete separately because cloudinary only deletes one type (image, raw) at a time
    await cloudinary.uploader.destroy(fileIds[0], { resource_type: 'image' })
    await cloudinary.uploader.destroy(fileIds[1], { resource_type: 'raw' })

    await clearDB(User);
    await clearDB(Chat);
    await clearDB(Message);
    await disconnectDB()
})

describe('posting messages in a chat', () => {
    it('should post valid message', async () => {
        const res = await postMessage({
            content: 'this is a valid message, hello there'
        }, 200, chat._id, authorization) 
    })

    it('posting message makes poster a chat member', async () => {
        await userRegister({ username: 'newMember', password: '12345678', confirmPassword: '12345678' }, 200);
        const res1 = await userLogin({ username: 'newMember', password: '12345678' }, 200);
        const newMember = res1.body;

        await postMessage({
            content: 'hi there'
        }, 200, chat._id, `Bearer ${newMember.token}`)

        const res3 = await postMessage({
            content: 'hi again'
        }, 200, chat._id, `Bearer ${newMember.token}`)

        const memberCount = res3.body.chat.members.filter(
            (m) => m.member._id === newMember.user._id
        ).length;

        expect(memberCount).toBe(1) // new member only once
    })

    it('returns errors on invalid content', async () => {
        // Invalid because no content and no attachment
        await postMessage({
            content: ''
        }, 400, chat._id, authorization) 

        // invalid because not a string
        await postMessage({
            content: 420
        }, 400, chat._id, authorization) 

        // Invalid because it goes over 250 char limit
        await postMessage({
            content: 'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium q'
        }, 400, chat._id, authorization) 
    })

    it('return error on invalid chat id', async () => {
        await postMessage({
            content: 'hi'
        }, 400, 'invalid id', authorization) 
    })

    it('return error on invalid jwt', async () => {
        await postMessage({
            content: 'hi'
        }, 401, chat._id, 'Bearer not.a.token') // Invalid token
    })
})

describe('posting messages with attachments', () => {
    it('should post message with valid attachment', async () => {
        const res = await postWithAttachment('', 'public/images/banana.jpg', 200, chat._id, authorization) 

        expect(res.body.fileId).toBeTruthy()
        expect(res.body.msg.attachment.type).toBe('image/jpeg')

        fileIds.push(res.body.fileId)

        // should also accept non-images
        const res2 = await postWithAttachment('this one has a message AND an attachment', 'public/random.txt', 200, chat._id, authorization)  

        expect(res2.body.fileId).toBeTruthy();
        expect(res2.body.msg.attachment.type).toBe('text/plain')

        fileIds.push(res2.body.fileId)
    })

    it('rejects invalid attachments', async () => {
        await postWithAttachment('árvore', 'public/árvore.txt', 500, chat._id, authorization) // this txt file has 0 bytes (not accepted)

        await postWithAttachment('bananas', 'public/images/bananas.jpg', 500, chat._id, authorization) // this image is too big (over 3MB)
    })

    it('rejects comments with no content or attachment', async () => {
        await postWithAttachment('', '', 400, chat._id, authorization);
    })
})
