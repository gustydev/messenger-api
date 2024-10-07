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