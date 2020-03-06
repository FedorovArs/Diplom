const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io').listen(server);

const path = require('path');
const publicPath = path.join(__dirname, '../public');

const port = process.env.PORT || 3000;

app.use(express.static(publicPath));

let publicGroupId = "00000000000000000000";
let publicGroupName = "public";
let publicGroupType = 0;
let userType = 1;
let publicGroupAvatar = "https://www.claycountygov.com/Home/ShowPublishedImage/11750/637051696408170000";
let defaultUserAvatar = "https://banner2.cleanpng.com/20190128/ulo/kisspng-security-hacker-white-hat-anonymous-logo-products-and-services-data-solver-5c4f1b3b23ab83.7011001115486881871461.jpg";
let currentTime = '';

function setCurrentTime() {
    currentTime = (new Date).toLocaleTimeString();
}

setTimeout(setCurrentTime, 1000);

const users = [{
    name: publicGroupName,
    connectedTime: currentTime,
    isOnline: true,
    id: publicGroupId,
    isActive: true,
    type: publicGroupType,
    avatar: publicGroupAvatar
}];
io.on('connection', (socket) => {
    console.log(`User with socketId ${socket.id} connected!`);

    socket.on('greeting', (userName) => {
        let isAlreadyExist = users.some(element => element.name === userName);
        if (isAlreadyExist) {
            socket.emit('nameIsBusy', `Name ${userName} is busy!`);
        } else {
            let user = {
                name: userName,
                connectedTime: currentTime,
                isOnline: true,
                id: socket.id,
                isActive: false,
                type: userType,
                avatar: defaultUserAvatar
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
        if (user === publicGroupName) {
            let filteredUsers = users.filter(element => element.id === socket.id);
            io.sockets.emit('addMessage', {
                type: publicGroupType,
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
                time: currentTime,
                recipient: socket.id
            });
        }
    });

    socket.on('disconnect', function () {
        let time = currentTime;
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

server.listen(port, () => console.log(`Server started on port ${port}`));