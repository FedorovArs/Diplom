const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io').listen(server);

const path = require('path');
const publicPath = path.join(__dirname, '../public');

const port = process.env.PORT || 3000;

app.use(express.static(publicPath));

const users = [{
    name: 'public',
    connectedTime: (new Date).toLocaleTimeString(),
    isOnline: true,
    id: '00000000000000000000',
    isActive: true,
    type: 0,
    avatar: "https://owips.com/sites/default/files/styles/225x120/public/clipart/avatars-clipart/527317/avatars-clipart-customer-profile-527317-6127671.jpg?itok=dZ_hTtRw"
}];
io.on('connection', (socket) => {
    console.log(`User with socketId ${socket.id} connected!`);

    socket.on('greeting', (userName) => {
        let isAlreadyExist = users.some(function (element) {
            return element.name === userName;
        });
        if (isAlreadyExist) {
            socket.emit('nameIsBusy', `Name ${userName} is busy!`);
        } else {
            let time = (new Date).toLocaleTimeString();
            let user = {
                name: userName, connectedTime: time, isOnline: true, id: socket.id, isActive: false, type: 1,
                avatar: "https://banner2.cleanpng.com/20190128/ulo/kisspng-security-hacker-white-hat-anonymous-logo-products-and-services-data-solver-5c4f1b3b23ab83.7011001115486881871461.jpg"
            };
            users.push(user);
            socket.broadcast.emit('userJoined', user);
        }
    });

    socket.on('getUsers', () => {
        if (users.length !== 1) {
            socket.emit('onlineUserList', JSON.stringify(users));
        }
    });

    socket.on('sendMessage', (msg, user) => {
        if (user === 'public') {
            let filteredUsers = users.filter(element => element.id === socket.id);
            io.sockets.emit('addMessage', {
                type: 0,
                message: msg,
                avatar: filteredUsers[0].avatar,
                name: filteredUsers[0].name,
                time: (new Date).toLocaleTimeString()
            });
        } else {
            let senderUser = users.filter(el => el.id === socket.id)[0];
            let filteredUser = users.filter(el => el.name === user)[0];

            io.sockets.sockets[filteredUser.id].emit('addMessage', {
                type: filteredUser.type,
                message: msg,
                avatar: filteredUser.avatar,
                name: senderUser.name,
                time: (new Date).toLocaleTimeString(),
                recipient: socket.id
            });

            io.sockets.sockets[socket.id].emit('addMessage', {
                type: 1,
                message: msg,
                avatar: filteredUser.avatar,
                name: '111',
                time: (new Date).toLocaleTimeString(),
                recipient: socket.id
            });
        }
    });

    socket.on('disconnect', function () {
        let time = (new Date).toLocaleTimeString();
        let deleteIndex = null;
        let deleteUser = null;

        for (let i = 0; i < users.length; i++) {
            let user = users[i];
            if (socket.id === user.id) {
                deleteIndex = i;
                deleteUser = user;
                break;
            }
        }

        if (deleteUser) {
            console.log(`В ${time} пользователь ${deleteUser.name} покинул чат`);
            socket.broadcast.emit('userDisconnect', deleteUser);
            users.splice(deleteIndex, 1);
        }
    });
});

server.listen(port, () => {
    console.log(`Server started on port ${port}`);
});