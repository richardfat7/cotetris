import Peerjs from 'peerjs';

// callbacks: onOpen, onClose, onError, onConnection
const initPeerJsClient = async (myId, peerJsConfig, callbacks = {}) => {
    const peerJsClient = new Peerjs(myId, peerJsConfig);

    await new Promise((resolve) => {
        peerJsClient.on('open', (id) => {
            callbacks.onOpen && callbacks.onOpen(id);

            resolve();
        });
    });
    peerJsClient.on('error', (err) => {
        callbacks.onError && callbacks.onError(err, peerJsClient);
    });
    peerJsClient.on('close', () => {
        callbacks.onClose && callbacks.onClose(peerJsClient);
    });
    peerJsClient.on('connection', async (connection) => {
        callbacks.onConnection && callbacks.onConnection(connection, peerJsClient);
    });

    return peerJsClient;
};

// callbacks: onOpen, onData, onClose, onError
const initConnection = async (connection, callbacks = {}) => {
    await new Promise((resolve) => {
        connection.on('open', () => {
            callbacks.onOpen && callbacks.onOpen(connection);

            resolve();
        });
    });

    connection.on('data', async (data) => {
        callbacks.onData && callbacks.onData(data, connection);
    });

    connection.on('close', () => {
        callbacks.onClose && callbacks.onClose(connection);
    });

    connection.on('error', (err) => {
        callbacks.onError && callbacks.onError(err, connection);
    });
};


export {
    initPeerJsClient,
    initConnection,
};
