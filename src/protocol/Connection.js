const PROTOCOL = 'CONNECTION';
const messageTypes = {
    PEER_CONNECTION_INFO: 'PEER_CONNECTION_INFO',
    NOTIFY_PEER_CONNECTION_INFO: 'NOTIFY_PEER_CONNECTION_INFO',

    REQUEST_CONNECT_TO_TEAMMATE: 'REQUEST_CONNECT_TO_TEAMMATE',
    REQUEST_CONNECT_TO_OPPONENT_LEADER: 'REQUEST_CONNECT_TO_OPPONENT_LEADER',
    REQUEST_CONNECT_TO_OPPONENT_TEAMMATE: 'REQUEST_CONNECT_TO_OPPONENT_TEAMMATE',

    ACK_CONNECT_TO_TEAMMATE: 'ACK_CONNECT_TO_TEAMMATE',
    ACK_CONNECT_TO_OPPONENT_LEADER: 'ACK_CONNECT_TO_OPPONENT_LEADER',
    ACK_CONNECT_TO_OPPONENT_TEAMMATE: 'ACK_CONNECT_TO_OPPONENT_TEAMMATE',
};

function createNotifyPeerConnectionInfoMessage(myId, opponentLeaderId, opponentTeammateId) {
    return JSON.stringify({
        protocol: PROTOCOL,
        type: messageTypes.NOTIFY_PEER_CONNECTION_INFO,
        from: myId,
        payload: {
            opponentLeaderId,
            opponentTeammateId,
        },
    });
}

function createAckConnectToTeammateMessage(myId) {
    return JSON.stringify({
        protocol: PROTOCOL,
        type: messageTypes.ACK_CONNECT_TO_TEAMMATE,
        from: myId,
    });
}

function createAckConnectToOpponentLeaderMessage(myId, leaderId, teammateId) {
    return JSON.stringify({
        protocol: PROTOCOL,
        type: messageTypes.ACK_CONNECT_TO_OPPONENT_LEADER,
        from: myId,
        payload: {
            leaderId,
            teammateId,
        },
    });
}

function createAckConnectToOpponentTeammateMessage(myId, leaderId, teammateId) {
    return JSON.stringify({
        protocol: PROTOCOL,
        type: messageTypes.ACK_CONNECT_TO_OPPONENT_TEAMMATE,
        from: myId,
        payload: {
            leaderId,
            teammateId,
        },
    });
}

function createPeerConnectionInfoMessage(myId, leaderId, teammateId, opponentLeaderId, opponentTeammateId) {
    return JSON.stringify({
        protocol: PROTOCOL,
        type: messageTypes.PEER_CONNECTION_INFO,
        from: myId,
        payload: {
            myId,
            teammateId,
            opponentLeaderId,
            opponentTeammateId,
        },
    });
}

function createConnectToTeammateMessage(myId) {
    return JSON.stringify({
        protocol: PROTOCOL,
        type: messageTypes.REQUEST_CONNECT_TO_TEAMMATE,
        from: myId,
        payload: {
            id: myId,
        },
    });
}

function createConnectToOpponentLeaderMessage(myId, leaderId, teammateId) {
    return JSON.stringify({
        protocol: PROTOCOL,
        type: messageTypes.REQUEST_CONNECT_TO_OPPONENT_LEADER,
        from: myId,
        payload: {
            id: myId,
            leaderId: leaderId,
            teammateId: teammateId,
        },
    });
}

function createConnectToOpponentTeammateMessage(myId, leaderId, teammateId, { referrer = '' }) {
    return JSON.stringify({
        protocol: PROTOCOL,
        type: messageTypes.REQUEST_CONNECT_TO_OPPONENT_TEAMMATE,
        from: myId,
        payload: {
            leaderId,
            teammateId,
        },
        referrer,
    });
}

export {
    PROTOCOL,
    messageTypes,

    createPeerConnectionInfoMessage,
    createNotifyPeerConnectionInfoMessage,

    createConnectToTeammateMessage,
    createConnectToOpponentLeaderMessage,
    createConnectToOpponentTeammateMessage,

    createAckConnectToTeammateMessage,
    createAckConnectToOpponentLeaderMessage,
    createAckConnectToOpponentTeammateMessage,
};
