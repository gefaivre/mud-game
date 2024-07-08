import express from 'express';
import { createServer } from 'http';
import WebSocket, { WebSocketServer } from 'ws';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ noServer: true });



const users = {
    "user1": "password1",  // Example user
};

let currentRandomNumber = 0;

const updateRandomNumber = () => {
    currentRandomNumber = Math.floor(Math.random() * 1000);
    console.log(`Updated random number to: ${currentRandomNumber}`);
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'info', number: currentRandomNumber }));
        }
    });
};

setInterval(updateRandomNumber, 5000);

app.get('/', (req, res) => res.send('Hello, world!'));

server.on('upgrade', (request, socket, head) => {
    // Basic auth example
    const auth = request.headers['authorization']; // Basic base64(username:password)
    if (!auth) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
    }

    const [username, password] = Buffer.from(auth.split(' ')[1], 'base64').toString().split(':');
    if (users[username] === password) {
        wss.handleUpgrade(request, socket, head, ws => {
            wss.emit('connection', ws, request);
        });
    } else {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
    }
});

wss.on('connection', ws => {
    console.log('Client connected');
    ws.on('close', () => console.log('Client disconnected'));
});

const PORT = 8080;
server.listen(PORT, () => console.log(`Server started on port ${PORT}`));