const { app, request, connectDB, disconnectDB, clearDB, userRegister, userLogin } = require('./setup');

const User = require('../src/models/user')
const Chat = require('../src/models/chat')

let authorization = '';
let updatedChat;
let admin;
let regular;

async function createChat(data, status, auth = authorization) {
    return await request(app)
    .post('/chat')
    .expect('Content-Type', /json/)
    .set('Authorization', auth)
    .send(data)
    .expect(status);
};

async function updateChat(data, status, chatId = updatedChat._id, auth = authorization) {
    return await request(app)
    .put(`/chat/${chatId}`)
    .expect('Content-Type', /json/)
    .set('Authorization', auth)
    .send(data)
    .expect(status);
};

beforeAll(async() => {
    await connectDB();
    await clearDB(User);
    await clearDB(Chat);

    await userRegister({
        username: 'admin',
        password: '12345678',
        confirmPassword: '12345678'
    }, 200)

    const res = await userLogin({username: 'admin', password: '12345678'}, 200)
    admin = res.body;
    authorization = `Bearer ${admin.token}`;

    await userRegister({
        username: 'regular',
        password: 'doesntmatter',
        confirmPassword: 'doesntmatter'
    }, 200);

    const res2 = await userLogin({username: 'regular', password: 'doesntmatter'}, 200)
    regular = res2.body;

    const res3 = await createChat({title: 'temporary title'}, 200)
    const chatId = res3.body.chat._id

    updatedChat = await Chat.findByIdAndUpdate(chatId, {
        $push: {
            members: {member: regular.user._id, isAdmin: false}
        }
    }, {new: true});
});

afterAll(async() => {
    await clearDB(User);
    await clearDB(Chat);
    await disconnectDB()
})

describe('new chat', () => {
    it('creates new chat with creator as admin', async() => {
        const res = await createChat({title: 'Test Title'}, 200)

        expect(res.body.chat.members[0].isAdmin).toBeTruthy();
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

        // invalid because title is not string
        await createChat({title: true}, 400)

        // invalid because description is not string
        await createChat({title: 'title', description: 420}, 400)
    })

    it('returns error on invalid jwt', async() => {
        await createChat({title: 'test title'}, 401, 'Bearer not.a.token')
    })
})

describe('update chat info', () => {
    it('updates chat with valid inputs', async() => {
        const res = await updateChat({
            title: 'New Title',
            description: 'new desc',
            public: true
        }, 200)

        expect(res.body.chat.title).toBe('New Title')
        expect(res.body.chat.description).toBe('new desc')
        expect(res.body.chat.public).toBeTruthy();

        const res2 = await updateChat({
            description: 'updating just the description this time',
        }, 200)

        expect(res2.body.chat.description).toBe('updating just the description this time')
        expect(res2.body.chat.title).toBe('New Title')
        expect(res2.body.chat.public).toBeTruthy();
    })

    it('rejects invalid inputs when updating', async() => {
        await updateChat({
            title: '',
            public: 'no'
        }, 400)
    })

    it('rejects updating if jwt is invalid', async() => {
        await updateChat({
            title: 'random'
        }, 401, updatedChat._id, 'Bearer not.a.token')
    })

    it('rejects updating if user is not in chat', async() => {
        await userRegister({
            username: 'notAChatter',
            password: 'notAChatter',
            confirmPassword: 'notAChatter'
        }, 200);

        const res = await userLogin({
            username: 'notAChatter',
            password: 'notAChatter'
        }, 200)

        const authy = `Bearer ${res.body.token}`;

        await updateChat({
            title: 'random'
        }, 403, updatedChat._id, authy)
    })

    it('rejects updating if user is not a chat admin', async() => {
        await updateChat({
            title: 'random'
        }, 403, updatedChat._id, `Bearer ${regular.token}`)
    })
})

describe('create dm chat', () => {
    it('creates a dm between two users', async() => {
        // user "admin" creates a dm chat with user "regular"
        await createChat({
            dm: true,
            recipient: regular.user._id
        }, 200)
    })

    it('rejects creating dm if it already exists', async() => {
        // this time, "regular" wants to create dm with "admin", which already exists
        await createChat({
            dm: true,
            recipient: admin.user._id
        }, 400, `Bearer ${regular.token}`)
    })

    it('rejects invalid inputs', async() => {
        await createChat({
            dm: 'yes' // not a boolean
            // lacks a recipient
        }, 400)
    })

    it('rejects creating dm with oneself', async() => {
        await createChat({
            dm: true,
            recipient: admin.user._id
        }, 400)
    })
})