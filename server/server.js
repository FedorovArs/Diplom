const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io').listen(server);

const path = require('path');
const publicPath = path.join(__dirname, '../public');

const port = process.env.PORT || 3000;

app.use(express.static(publicPath));
io.on('connection', (socket) => {
    console.log(`User with socketId ${socket.id} connected!`);

    socket.on('sendMessage', (msg) => io.emit('addMessage', msg));
});

server.listen(port, () => {
    console.log(`Server started on port ${port}`);
});