const { app, request, connectDB, disconnectDB, clearDB } = require('./setup');

const User = require('../src/models/user')
const Chat = require('../src/models/chat')

let authorization = '';

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
});

afterAll(async() => {
    await clearDB(User);
    await clearDB(Chat);
    await disconnectDB()
})

describe('new chat', () => {
    it('creates new chat', async() => {
        await request(app)
        .post('/chat/new')
        .expect('Content-Type', /json/)
        .set('Authorization', authorization)
        .send({
            title: 'Test Title'
        })
        .expect(200)
    })

    it('allows chat to be set as public or private', async() => {
        const res = await request(app)
        .post('/chat/new')
        .expect('Content-Type', /json/)
        .set('Authorization', authorization)
        .send({
            title: 'Public Chat',
            public: true
        })
        .expect(200)

        expect(res.body.chat.public).toBeTruthy()

        const res2 = await request(app)
        .post('/chat/new')
        .expect('Content-Type', /json/)
        .set('Authorization', authorization)
        .send({
            title: 'Private Chat',
            public: false
        })
        .expect(200)

        expect(res2.body.chat.public).toBeFalsy()
    })
})