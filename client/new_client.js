import WebSocket from 'ws';
import readline from 'readline';

const serverUrl = 'ws://localhost:8080';
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let number = null;
// Function to get credentials from the user and initiate connection
function promptForCredentials() {
    rl.question('Enter your username: ', (username) => {
        rl.question('Enter your password: ', (password) => {
            initializeWebSocket(username, password);
        });
    });
}

// Function to initialize WebSocket connection
function initializeWebSocket(username, password) {
    const authString = 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');
    const options = {
        headers: { Authorization: authString }
    };
    const ws = new WebSocket(serverUrl, options);

    ws.on('open', () => {
        console.log("Connected to the server!");
        rl.setPrompt('HelloWorld: ');
        rl.prompt();
    });

    ws.on('message', data => {
        const message = JSON.parse(data);
        if (message.type === 'info') {
            number = message.number;
        }
    });

    ws.on('close', (code) => {
        if (code === 1006) { // Abnormal closure, possibly authentication failure
            // console.log("Authentication failed. Please try again.");
            // promptForCredentials(); // Prompt the user again for credentials
        } else {
            console.log("Disconnected from server");
            rl.close();
        }
    });

    ws.on('error', error => {
        if (error.message.includes('401')) {
            // Handle 401 specifically
            console.log("Authentication failed. Please re-enter your credentials.");
            promptForCredentials();
        } else {
            console.error("WebSocket error:", error);
        }
    });

    rl.on('line', line => {
        if (line.trim() === '/help') {
            console.log(`/help: Show this help message`);
            console.log(`/show: Show the random number`);
            console.log(`/exit: Exit the program`);
        } else if (line.trim() === '/show') {
                if (ws.readyState === WebSocket.OPEN && number) {
                    console.log(`The latest random number is: ${number}`);
                } else {
                    console.log('Connection not open.');
                    rl.prompt();
                }
            rl.prompt();
        } else if (line.trim() === '/exit') {
            console.log('Exiting...');
            ws.close();
        }
    });
}

// Start the client by prompting for credentials
promptForCredentials();
