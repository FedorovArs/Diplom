const {v4: uuidv4} = require('uuid');

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
let userType = 2;
let groupType = 1;
let publicGroupAvatar = "./img/defaultPublicGroupAvatar.jpg";
let defaultUserAvatar = "./img/defaultUserAvatar.jpg";
let privateGroupAvatar = "./img/privateGroupAvatar.png";
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

const rooms = [];
io.on('connection', (socket) => {
    console.log(`User with socketId ${socket.id} connected!`);

    socket.on('addUsersToRoom', (roomName, addUsers) => {
        let currentRoom = rooms.filter(el => el.name === roomName)[0];
        for (let i = 0; i < addUsers.length; i++) {
            let userSocket = io.sockets.sockets[addUsers[i]];

            if (!currentRoom.members.includes(addUsers[i])) {
                userSocket.join(roomName);
                currentRoom.members.push(addUsers[i]);
                userSocket.emit('roomCreated', currentRoom)
            }
        }
    });

    socket.on('sendRoomMessage', (msg, activeUserName) => {
        let senderUser = users.filter(el => el.id === socket.id)[0];
        let room = rooms.filter(el => el.name === activeUserName)[0];

        io.sockets.to(activeUserName).emit('addRoomMessage', {
            type: groupType,
            groupName: activeUserName,
            message: msg,
            avatar: defaultUserAvatar,
            name: senderUser.name,
            time: currentTime,
            recipient: room.id
        });
    });

    socket.on('createRoom', (roomInfo) => {
        let isAlreadyExist = rooms.some(element => element.name === roomInfo.roomName);
        if (isAlreadyExist) {
            socket.emit('roomNameIsBusy', `Name ${roomInfo.roomName} is busy!`);
        } else {
            socket.join(roomInfo.roomName);

            let room = {
                name: roomInfo.roomName,
                connectedTime: currentTime,
                isOnline: true,
                id: uuidv4(),
                isActive: false,
                type: groupType,
                avatar: privateGroupAvatar,
                members: [socket.id]
            };
            rooms.push(room);
            socket.emit('roomCreated', room);
        }
    });

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

    socket.on('sendMessage', (msg, activeUserName) => {
        if (activeUserName === publicGroupName) {
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
            let filteredUser = users.filter(el => el.name === activeUserName)[0];

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

        for (let i = 0; i < rooms.length; i++) {
            let room = rooms[i];

            for (let j = 0; j < room.members.length; j++) {
                let memberId = room.members[j];
                if (memberId === socket.id) {
                    room.members.splice(j, 1);
                    if (room.members.length === 0) {
                        console.log(`Группа ${rooms[i].name} будет удалена`);
                        rooms.splice(i, 1);
                    }
                }
            }
        }
    });
});

server.listen(port, () => console.log(`Server started on port ${port}`));