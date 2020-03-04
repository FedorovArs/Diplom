const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io').listen(server);

const path = require('path');
const publicPath = path.join(__dirname, '../public');

const port = process.env.PORT || 3000;

app.use(express.static(publicPath));

const users = [];
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
                name: userName, connectedTime: time, isOnline: true, id: socket.id, isActive: false,
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

    socket.on('sendMessage', (msg, socketId) => {
        if (socketId) {
            io.sockets.sockets[socketId].emit('addMessage', msg)
        } else {
            io.emit('addMessage', msg)
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