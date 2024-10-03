const { app, request, connectDB, disconnectDB, clearDB } = require('./setup');

const User = require('../src/models/user')
const Chat = require('../src/models/chat')
const Message = require('../src/models/message')

let authorization;
let chat;

beforeAll(async() => {
    await connectDB();
    await clearDB(User);
    await clearDB(Chat);

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
    .post('/chat/new')
    .expect('Content-Type', /json/)
    .set('Authorization', authorization)
    .send({
        title: 'Test Chat'
    })
    .expect(200);

    chat = res2.body.chat;
});

afterAll(async() => {
    await clearDB(User);
    await clearDB(Chat);
    await disconnectDB()
})

async function postMessage(data, chatId, status, auth = authorization) {
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
            content: 'this is a valid message, hello :>'
        }, chat._id, 200)
    })

    it('return error on invalid content', async() => {
        // Invalid because no content and no attachment
        await postMessage({
            content: ''
        }, chat._id, 400)
    })

    it('return error on invalid chat id', async() => {
        await postMessage({
            content: 'hi'
        }, 'not a chat id', 400)
    })

    it('return error on invalid jwt', async() => {
        await postMessage({
            content: 'hi'
        }, chat._id, 400, 'Bearer not.a.token')
    })
})