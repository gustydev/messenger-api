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

async function createChat(data, status, auth = authorization) {
    return await request(app)
    .post('/chat/new')
    .expect('Content-Type', /json/)
    .set('Authorization', auth)
    .send(data)
    .expect(status);
};

describe('new chat', () => {
    it('creates new chat', async() => {
        await createChat({title: 'Test Title'}, 200)
    })

    it('allows chat to be set as public or private', async() => {
        const res = await createChat({
            title: 'Public Chat',
            public: true
        }, 200)

        expect(res.body.chat.public).toBeTruthy()

        const res2 = await createChat({
            title: 'Private Chat',
            public: false
        }, 200)

        expect(res2.body.chat.public).toBeFalsy()
    })

    it('returns errors on invalid inputs', async() => {
        // Invalid: no title
        await createChat({title: ''}, 400)

        // Invalid: description is too long (200+ chars)
        await createChat({
            title: 'valid title',
            description: 'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec qua'
        }, 400)

        // Invalid: public is not boolean
        await createChat({title: 'valid title', public: 'public'}, 400)
    })

    it('returns error on invalid jwt', async() => {
        await createChat({title: 'test title'}, 400, 'Bearer not.a.token')
    })
})