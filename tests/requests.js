const { app, request } = require('./setup');

async function userRegister(data, status) {
    return await request(app)
        .post('/user/register')
        .expect('Content-Type', /json/)
        .send(data)
        .expect(status);
}

async function userLogin(data, status) {
    return await request(app)
        .post('/user/login')
        .expect('Content-Type', /json/)
        .send(data)
        .expect(status);
}

async function userUpdate(data, status, authorization, userId) {
    return await request(app)
        .put(`/user/${userId}`)
        .expect('Content-Type', /json/)
        .set('Authorization', authorization)
        .send(data)
        .expect(status);
}

async function userDelete(status, authorization, userId) {
    return await request(app)
        .delete(`/user/${userId}`)
        .set('Authorization', authorization)
        .expect(status);
}

async function uploadPFP(path, status, authorization, userId) {
    return await request(app)
        .put(`/user/${userId}`)
        .set('Authorization', authorization)
        .attach('pic', path)
        .expect(status);
}

async function createChat(data, status, auth) {
    return await request(app)
        .post('/chat')
        .expect('Content-Type', /json/)
        .set('Authorization', auth)
        .send(data)
        .expect(status);
}

async function updateChat(data, status, chatId, auth) {
    return await request(app)
        .put(`/chat/${chatId}`)
        .expect('Content-Type', /json/)
        .set('Authorization', auth)
        .send(data)
        .expect(status);
}

async function postMessage(data, status, chatId, auth) {
    return await request(app)
        .post(`/chat/${chatId}/message`)
        .set('Authorization', auth)
        .expect('Content-Type', /json/)
        .send(data)
        .expect(status);
}

async function postWithAttachment(content, attachment, status, chatId, auth) {
    return await request(app)
    .post(`/chat/${chatId}/message`)
    .set('Authorization', auth)
    .field('content', content)
    .attach('attachment', attachment)
    .expect(status)
}

module.exports = {
    userRegister,
    userLogin,
    userUpdate,
    userDelete,
    uploadPFP,
    createChat,
    updateChat,
    postMessage,
    postWithAttachment
};
