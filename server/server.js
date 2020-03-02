const express = require('express');
const socketIO = require('socket.io');
const path = require('path');
const http = require('http');

const publicPath = path.join(__dirname, '../public');
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const port = process.env.PORT || 3000;

app.use(express.static(publicPath));
io.on('connection', () => {
    console.log('User connected');
});

server.listen(port, () => {
    console.log(`Server started on port ${port}`);
});