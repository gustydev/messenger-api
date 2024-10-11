const { app, request, connectDB, disconnectDB, clearDB } = require('./setup');
const cloudinary = require('cloudinary').v2;
cloudinary.config({
    secure: true
});

const User = require('../src/models/user')
const Chat = require('../src/models/chat')
const Message = require('../src/models/message')

let authorization;
let chat;
const fileIds = []; // array of uploaded file id's to be cleared after tests

beforeAll(async() => {
    await connectDB();
    await clearDB(User);
    await clearDB(Chat);
    await clearDB(Message)

    await request(app)
    .post('/user/register')
    .send({
        username: 'test',
        password: '12345678',
        confirmPassword: '12345678'
    })
    .expect(200);

    const res = await request(app)
    .post('/user/login')
    .send({username: 'test', password: '12345678'})
    .expect(200)

    authorization = `Bearer ${res.body.token}`;

    const res2 = await request(app)
    .post('/chat')
    .expect('Content-Type', /json/)
    .set('Authorization', authorization)
    .send({
        title: 'Test Chat'
    })
    .expect(200);

    chat = res2.body.chat;
});

afterAll(async() => {
    // need to delete separately because cloudinary only deletes one type (image, raw) at a time
    await cloudinary.uploader.destroy(fileIds[0], {resource_type: 'image'})
    await cloudinary.uploader.destroy(fileIds[1], {resource_type: 'raw'})

    await clearDB(User);
    await clearDB(Chat);
    await clearDB(Message);
    await disconnectDB()
})

async function postMessage(data, status, chatId = chat._id, auth = authorization) {
    return await request(app)
    .post(`/chat/${chatId}/message`)
    .set('Authorization', auth)
    .expect('Content-Type', /json/)
    .send(data)
    .expect(status)
}

describe('posting messages in a chat', () => {
    it('should post valid message', async() => {
        await postMessage({
            content: 'this is a valid message, hello there'
        }, 200)
    })

    it('returns errors on invalid content', async() => {
        // Invalid because no content and no attachment
        await postMessage({
            content: ''
        }, 400)

        // invalid because not a string
        await postMessage({
            content: 420
        }, 400)

        // Invalid because it goes over 250 char limit
        await postMessage({
            content: 'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium q'
        }, 400)
    })

    it('return error on invalid chat id', async() => {
        await postMessage({
            content: 'hi'
        }, 400, 'invalid id')
    })

    it('return error on invalid jwt', async() => {
        await postMessage({
            content: 'hi'
        }, 401, chat._id, 'Bearer not.a.token')
    })
})

async function postWithAttachment(content, attachment = null, status, chatId = chat._id, auth = authorization) {
    return await request(app)
    .post(`/chat/${chatId}/message`)
    .set('Authorization', auth)
    .field('content', content)
    .attach('attachment', attachment)
    .expect(status)
}

describe('posting messages with attachments', () => {
    it('should post message with valid attachment', async() => {
        const res = await postWithAttachment('', 'public/images/banana.jpg', 200)
        expect(res.body.fileId).toBeTruthy()

        fileIds.push(res.body.fileId)

        // should also accept non-images
        const res2 = await postWithAttachment('this one has a message AND an attachment', 'public/random.txt', 200) 
        expect(res2.body.fileId).toBeTruthy();

        fileIds.push(res2.body.fileId)
    })

    it('rejects invalid attachements', async() => {
        await postWithAttachment('árvore', 'public/árvore.txt', 500) // this txt file has 0 bytes (not accepted)

        await postWithAttachment('bananas', 'public/images/bananas.jpg', 500) // this image is too big (over 3MB)
    })

    it('rejects comments with no content or attachment', async() => {
        await postWithAttachment('', '', 400);
    })
})