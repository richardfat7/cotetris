import React from 'react';
import PropTypes from 'prop-types';
import { nanoid } from 'nanoid';
import * as R from 'ramda';

import { List } from 'immutable';

// Data Model
import Member from '../../model/Member';

// Protocol
import {
    PROTOCOL as CONNECTION_PROTOCOL,
    MessageTypes as ConnectionMessageTypes,

    createConnectToUserMessage,
    createAckConnectToUserMessage,
    createRequestConnectionInfoMessage,
    createResponseConnectionInfoMessage,
    createJoinLobbyMessage,
    createAckJoinLobbyMessage,

    createAssignTeamMessage, // eslint-disable-line no-unused-vars
    createAckAssignTeamMessage, // eslint-disable-line no-unused-vars
    createChooseTeamMessage, // eslint-disable-line no-unused-vars
    createAckChooseTeamMessage, // eslint-disable-line no-unused-vars

    createToggleReadyMessage,
    createInitGameMessage, // eslint-disable-line no-unused-vars
    createAckInitGameMessage, // eslint-disable-line no-unused-vars

    createPingMessage,
    createPongMessage,
} from '../../protocol/Connection';
import { initConnection, initPeerJsClient } from '../../utils/peerJsUtils';

// Components
import Lobby from './Lobby';
import PeerJsUserRegisterForm from './PeerJsUserRegisterForm';
import PeerJsConfigForm from './PeerJsConfigForm';

import styles from './index.less';

// Store & actions
import store from '../../store';
import todo from '../../control/todo';
import actions from '../../actions';

import * as reducerType from '../../unit/reducerType';

const MAX_RETRY_COUNT = 5; // 0, 500, 1500, 4500, 13500, 15000
const RETRY_COEFF = 3;
const RETRY_BASE = 500;
const MESSAGE_RETRY_CAP = 15000;
const FETCH_CONNECTION_INFO_INTERVAL = 10000;
const MessageState = {
    // Also NOT_EXISTS
    RECEIVED: 20,
    FINISHED: 30,
};

export default class Peer extends React.Component {
    static propTypes = {
        history: PropTypes.object,
        cur: PropTypes.bool,
        max: PropTypes.number,
        point: PropTypes.number,

        onRegister: PropTypes.func.isRequired,
        // onSaveTeamInfo: PropTypes.func.isRequired,
        // onSaveConnectionLookup: PropTypes.func.isRequired,

        showReduxConnectionInfo: PropTypes.func.isRequired,
    };

    constructor(props) {
        super(props);

        // TODO: GC Finished state later
        this._messageStateLookup = {};
        this._messageRetryCountLookup = {};
        this._fetchConnectionInfoTimer = null;
        this._peerJsClient = null;
        this._memberLookup = {};
        this._connectionLookup = {};

        this.state = {
            peerJsConfig: {
                host: 'localhost',
                port: 9000,
                path: '/cotetris',

                // Set highest debug level (log everything!).
                debug: 3,
            },

            isHosting: false,
            myId: '',
            displayName: '',
            // teamInfo: [team1, team2]
            team1: {
                id: 0,
                memberIds: [],
                teamColor: '#ccffcc',
            },
            team2: {
                id: 1,
                memberIds: [],
                teamColor: '#ccccff',
            },
            lobbyMemberIds: [],

            errorMessage: '',
            rerenderKey: 0,
        };
    }

    componentWillUnmount() {
        if (this._fetchConnectionInfoTimer) {
            clearInterval(this._fetchConnectionInfoTimer);
        }
    }

    // legacy codes !?!?!?!
    shouldComponentUpdate({ cur, point, max }) {
        const props = this.props;

        return cur !== props.cur || point !== props.point || max !== props.max || !props.cur;
    }

    // DEBUG
    showAllConnection = () => {
        const { myId, team1, team2, lobbyMemberIds } = this.state;

        console.log('this._connectionLookup', this._connectionLookup);
        console.log('this._memberLookup', this._memberLookup);
        console.log('myId', myId);
        console.log('team1', team1);
        console.log('team2', team2);
        console.log('lobbyMemberIds', lobbyMemberIds);
    }

    sendPingMessageToAllConnection = () => {
        const { myId } = this.state;

        for (let connectionId in this._connectionLookup) {
            const messageToSend = createPingMessage(myId);

            this._connectionLookup[connectionId].send(messageToSend);
        }
    }

    /**
     * PeerJs connections
     *  */
    _broadcastConnectionInfo = () => {
        const { myId, team1, team2, lobbyMemberIds } = this.state;

        for (let memberId of lobbyMemberIds) {
            if (myId !== memberId) {
                const messageToSend = createResponseConnectionInfoMessage(myId, {
                    teamInfo: [team1, team2],
                    memberLookup: this._memberLookup,
                    lobbyMemberIds,
                });

                this._connectionLookup[memberId].send(messageToSend);
            }
        }
    }

    _setMessageFinished = (message) => {
        const { uniqueId } = message;

        this._messageStateLookup[uniqueId] = MessageState.FINISHED;
    }

    _retryMessage = (message) => {
        const { uniqueId } = message;
        const retryCount = this._messageRetryCountLookup[uniqueId];
        const retryTimeout = Math.min(MESSAGE_RETRY_CAP, RETRY_BASE * Math.pow(RETRY_COEFF, retryCount + 1));
        const messageState = this._messageStateLookup[uniqueId];

        this._messageRetryCountLookup[uniqueId]++;

        // TODO: create state machine library and fire by trigger later
        if (messageState !== MessageState.FINISHED && retryCount < MAX_RETRY_COUNT) {
            setTimeout(() => this._handlePeerJsMessage(message), retryTimeout);
        }
    }

    _handlePeerJsClientOpen = (myId, isHosting) => {
        const { peerJsConfig } = this.state;

        this.props.onRegister(myId, isHosting, peerJsConfig);
    }

    _handlePeerJsClientClose = (err) => {
        this.setState({ errorMessage: 'Peerjs client close, please refresh' });
    }

    // TODO: handle error
    _handlePeerJsClientError = (err) => {
        this.setState({ errorMessage: `${err.message} ${err.stack}` });
    }

    _handlePeerJsDataConnectionOpen = (connection) => {
        if (this._connectionLookup[connection.peer]) {
            this._handlePeerJsDataConnectionError(new Error(`connection for id ${connection.peer} exists`));

            return;
        }

        this._connectionLookup[connection.peer] = connection;
    }

    // TODO: handle error
    _handlePeerJsDataConnectionError = (err, connection) => {
        this.setState({ errorMessage: `${err.message} ${err.stack}` });
    }
    _handlePeerJsDataConnectionClose = (connection) => {
        const connectionIdToDrop = connection.peer;
        const { isHosting } = this.state;

        delete this._connectionLookup[connectionIdToDrop];
        delete this._memberLookup[connectionIdToDrop];

        if (isHosting) {
            this.setState((state) => ({
                lobbyMemberIds: state.lobbyMemberIds.filter((id) => id !== connectionIdToDrop),
            }));
        }

        this.setState({ errorMessage: `Connection ${connection.peer} close, please refresh` });
    }
    _handlePeerJsMessage = (message, connection) => {
        const { protocol, type, uniqueId } = message;
        const myplayerid = store.getState().get('myplayerid');

        if (this._messageStateLookup[uniqueId] === MessageState.FINISHED) {
            console.error('_handlePeerJsMessage: message already resolved', { uniqueId });

            return;
        }

        if (protocol === CONNECTION_PROTOCOL) {
            if (type === ConnectionMessageTypes.CONNECT_TO_USER) {
                this._handleConnectToUser(message, connection);
            } else if (type === ConnectionMessageTypes.ACK_CONNECT_TO_USER) {
                this._handleAckConnectToUser(message, connection);
            } else if (type === ConnectionMessageTypes.REQUEST_CONNECTION_INFO) {
                this._handleRequestConnectionInfo(message);
            } else if (type === ConnectionMessageTypes.RESPONSE_CONNECTION_INFO) {
                this._handleResponseConnectionInfo(message);
            } else if (type === ConnectionMessageTypes.JOIN_LOBBY) {
                this._handleJoinLobby(message);
            } else if (type === ConnectionMessageTypes.ACK_JOIN_LOBBY) {
                this._handleAckJoinLobby(message);
            } else if (type === ConnectionMessageTypes.PING) {
                this._handlePing(message);
            } else if (type === ConnectionMessageTypes.PONG) {
                this._handlePong(message);
            } else if (type === ConnectionMessageTypes.TOGGLE_READY) {
                this._handleToggleReady(message);
            }
        } else if (message.label === 'syncmove') {
            todo[message.key].down(store, message.id);
            todo[message.key].up(store);
        } else if (message.label === 'linesSent') {
            if (message.team === ((myplayerid <= 1) ? 'LEFT' : 'RIGHT')) {
                store.dispatch({ type: reducerType.LINES_RECEIVED, data: message.data });
            }
        } else if (message.label === 'syncgame') {
            if (message.team === ((myplayerid <= 1) ? 'LEFT' : 'RIGHT')) {
                if (message.attr === 'matrix') {
                    // console.log('matrix');
                    let newMatrix = List();

                    message.data.forEach((m) => {
                        newMatrix = newMatrix.push(List(m));
                    });
                    store.dispatch(actions.matrix(newMatrix));
                } else if (message.attr === 'cur2') {
                    // console.log('cur2');
                    const newCur = message.data;
                    let newShape = List();

                    newCur.shape.forEach((m) => {
                        newShape = newShape.push(List(m));
                    });

                    const next = {
                        shape: newShape,
                        type: newCur.type,
                        xy: newCur.xy,
                        rotateIndex: newCur.rotateIndex,
                        timeStamp: newCur.timeStamp,
                    };

                    // console.log(next);
                    store.dispatch(actions.moveBlock2(next));
                } else if (message.attr === 'cur') {
                    const newCur = message.data;
                    let newShape = List();

                    newCur.shape.forEach((m) => {
                        newShape = newShape.push(List(m));
                    });

                    const next = {
                        shape: newShape,
                        type: newCur.type,
                        xy: newCur.xy,
                        rotateIndex: newCur.rotateIndex,
                        timeStamp: newCur.timeStamp,
                    };

                    // console.log(next);
                    store.dispatch(actions.moveBlock(next));
                }
            } else if (message.team !== ((myplayerid <= 1) ? 'LEFT' : 'RIGHT')) {
                if (message.attr === 'matrix') {
                    // console.log('matrix');
                    let newMatrix = List();

                    message.data.forEach((m) => {
                        newMatrix = newMatrix.push(List(m));
                    });
                    store.dispatch(actions.matrixOppo(newMatrix));
                } else if (message.attr === 'cur2') {
                    // console.log('cur2');
                    const newCur = message.data;
                    let newShape = List();

                    newCur.shape.forEach((m) => {
                        newShape = newShape.push(List(m));
                    });

                    const next = {
                        shape: newShape,
                        type: newCur.type,
                        xy: newCur.xy,
                        rotateIndex: newCur.rotateIndex,
                        timeStamp: newCur.timeStamp,
                    };

                    // console.log(next);
                    store.dispatch(actions.moveBlockOppo2(next));
                } else if (message.attr === 'cur') {
                    const newCur = message.data;
                    let newShape = List();

                    newCur.shape.forEach((m) => {
                        newShape = newShape.push(List(m));
                    });

                    const next = {
                        shape: newShape,
                        type: newCur.type,
                        xy: newCur.xy,
                        rotateIndex: newCur.rotateIndex,
                        timeStamp: newCur.timeStamp,
                    };

                    // console.log(next);
                    store.dispatch(actions.moveBlockOppo(next));
                }
            }
        }
    }
    _handlePeerJsDataConnectionData = (data, connection) => {
        const message = JSON.parse(data);
        const { protocol, type, from: messageFrom, uniqueId } = message;

        // TODO: verify for other protocol
        // Verify message shape
        if (protocol === CONNECTION_PROTOCOL) {
            if (!type || !protocol || !messageFrom || !uniqueId) {
                this.setState({ errorMessage: 'message does not fit protocol' });

                return;
            }
        }

        // Verify message arrival
        if (this._messageStateLookup[uniqueId]) {
            // message received already
            console.error('Message with same unique ID arrived', {
                uniqueId,
                message,
            });

            return;
        }

        this._messageStateLookup[uniqueId] = MessageState.RECEIVED;
        this._messageRetryCountLookup[uniqueId] = 0;
        // Finish Verify message arrival

        const targetConnection = this._connectionLookup[messageFrom];

        // Verify connection ID
        if (targetConnection) {
            console.assert(targetConnection.peer === messageFrom, '_handleJoinLobby: targetConnection ID is not the same as messageFrom', {
                targetConnectionId: targetConnection.peer,
                messageFrom,
            });
        }

        this._handlePeerJsMessage(message, connection);
    }

    // message handlers
    _handleConnectToUser = (message, connection) => {
        const { from: messageFrom, payload } = message;
        const { myId, displayName: myDisplayName } = this.state;
        const { displayName } = payload;

        this._connectionLookup[messageFrom] = connection;
        this._memberLookup[messageFrom] = new Member(messageFrom, displayName, false);

        // create new member and add it
        this._connectionLookup[messageFrom].send(createAckConnectToUserMessage(myId, { displayName: myDisplayName }));
        this._setMessageFinished(message);
    }

    _handleAckConnectToUser = (message, connection) => {
        const { from: messageFrom, payload } = message;
        const { displayName } = payload;

        this._connectionLookup[messageFrom] = connection;
        this._memberLookup[messageFrom] = new Member(messageFrom, displayName, false);
        this._setMessageFinished(message);
    }

    _handleRequestConnectionInfo = (message) => {
        // Drop the message if not host
        const { from: messageFrom } = message;
        const { isHosting, myId, lobbyId, team1, team2, lobbyMemberIds } = this.state;
        const targetConnection = this._connectionLookup[messageFrom];

        if (!isHosting) {
            console.error('_handleRequestConnectionInfo: Not a host', {
                lobbyId,
                myId,
                messageFrom,
            });
            this._setMessageFinished(message);

            return;
        }

        if (targetConnection) {
            const messageToSend = createResponseConnectionInfoMessage(myId, {
                teamInfo: [team1, team2],
                memberLookup: this._memberLookup,
                lobbyMemberIds,
            });

            this._connectionLookup[messageFrom].send(messageToSend);
            this._setMessageFinished(message);
        } else {
            this._retryMessage(message);
        }
    }

    _handleResponseConnectionInfo = (message) => {
        // Verify if the message is from host
        const { from: messageFrom, payload } = message;
        const { teamInfo, lobbyMemberIds, memberLookup } = payload;
        const [ team1, team2 ] = teamInfo;
        const { lobbyId, isHosting } = this.state;

        if (!isHosting && (messageFrom === lobbyId)) {
            this._memberLookup = memberLookup;

            this.setState({
                team1, team2,
                lobbyMemberIds,
            });
        } else {
            console.error('_handleResponseConnectionInfo: Spoof as host', {
                lobbyId,
                messageFrom,
            });
        }

        this._setMessageFinished(message);
    }

    _handleJoinLobby = (message) => {
        const { from: messageFrom } = message;

        const targetConnection = this._connectionLookup[messageFrom];

        if (targetConnection) {
            const { myId, team1, team2, lobbyMemberIds } = this.state;
            const messageToSend = createAckJoinLobbyMessage(myId, {
                teamInfo: [team1, team2],
                lobbyMemberIds: [...lobbyMemberIds, messageFrom],
            });

            this.setState((state) => ({
                lobbyMemberIds: [...state.lobbyMemberIds, messageFrom],
            }));

            this._connectionLookup[messageFrom].send(messageToSend);
            this._setMessageFinished(message);
        } else {
            this._retryMessage(message);
        }
    }

    _handleAckJoinLobby = (message) => {
        const { from: messageFrom, payload } = message;

        const targetConnection = this._connectionLookup[messageFrom];

        if (targetConnection) {
            const { myId, lobbyId } = this.state;
            const { teamInfo, lobbyMemberIds } = payload;
            const [ team1, team2 ] = teamInfo;

            this.setState({
                team1,
                team2,
                lobbyMemberIds,
            });

            const sendRequestConnectionInfoMessage = () => {
                const messageToSend = createRequestConnectionInfoMessage(myId);

                this._connectionLookup[lobbyId].send(messageToSend);
            };

            this._fetchConnectionInfoTimer = setInterval(sendRequestConnectionInfoMessage, FETCH_CONNECTION_INFO_INTERVAL);
            this._setMessageFinished(message);
        } else {
            this._retryMessage(message);
        }
    }

    _handleToggleReady = (message) => {
        const { from: messageFrom } = message;
        const { isHosting } = this.state;

        const targetConnection = this._connectionLookup[messageFrom];
        const targetMember = this._memberLookup[messageFrom];

        if (!isHosting) {
            console.error('_handleToggleReady: Not a host');
            this._setMessageFinished(message);

            return;
        }

        if (targetConnection && targetMember) {
            targetMember.isReady = !targetMember.isReady;

            this.setState({ rerenderKey: Math.random() }); // trigger re-render

            this._broadcastConnectionInfo();
            this._setMessageFinished(message);
        } else {
            this._retryMessage(message);
        }
    }

    _handlePing = (message) => {
        const { from: messageFrom } = message;
        const targetConnection = this._connectionLookup[messageFrom];
        const { myId } = this.state;

        console.log('receive pinged', { messageFrom });

        if (targetConnection) {
            targetConnection.send(createPongMessage(myId));
        }

        this._setMessageFinished(message);
    }
    _handlePong = (message) => {
        const { from: messageFrom } = message;

        console.log('receive pong', { messageFrom });

        this._setMessageFinished(message);
    }

    /**
     * User actions
     *  */
    _chooseTeam = (event, teamId) => {
        const { myId, lobbyId } = this.state;

        const messageToSend = createChooseTeamMessage(myId, { targetTeamId: teamId });
    }

    _connectToLobby = async (lobbyId, myId, displayName) => {
        const connection = this._peerJsClient.connect(lobbyId);

        await this._handlePeerJsClientConnection(connection);

        connection.send(createConnectToUserMessage(myId, { displayName }));
        connection.send(createJoinLobbyMessage(myId));

        return Promise.resolve();
    }

    _handleReadyButtonClick = (event) => {
        // Don't update local state for ack to verify
        const { myId, lobbyId, isHosting } = this.state;

        if (isHosting) {
            const myMember = this._memberLookup[myId];

            myMember.isReady = !myMember.isReady;
            this.setState({ rerenderKey: Math.random() });

            this._broadcastConnectionInfo();
        } else {
            const messageToSend = createToggleReadyMessage(myId);

            this._connectionLookup[lobbyId].send(messageToSend);
        }
    }

    _handlePeerJsClientConnection = async (connection) => {
        await initConnection(connection, {
            onOpen: (connection) => {
                this._handlePeerJsDataConnectionOpen(connection);
            },
            onError: (err, connection) => {
                this._handlePeerJsDataConnectionError(err, connection);
            },
            onClose: (connection) => {
                this._handlePeerJsDataConnectionClose(connection);
            },
            onData: async (data, connection) => {
                await this._handlePeerJsDataConnectionData(data, connection);
            },
        });
    }

    _createPeerJsClient = async (myId, peerJsConfig, { isHosting }) => {
        return await initPeerJsClient(myId, peerJsConfig, {
            onOpen: (id, peerJsClient) => {
                this._handlePeerJsClientOpen(myId, isHosting);
            },
            onError: (err, peerJsClient) => {
                this._handlePeerJsClientError(err);
            },
            onClose: (peerJsClient) => {
                this._handlePeerJsClientClose();
            },
            onConnection: async (connection, peerJsClient) => {
                await this._handlePeerJsClientConnection(connection);
            },
        });
    }

    // Create lobby
    // TODO: handle the case that lobby created with the same lobbyId
    _handlePeerJsRegisterHost = async (event, lobbyId, displayName) => {
        const myId = lobbyId;
        const myMember = new Member(myId, displayName, false);
        const { peerJsConfig } = this.state;

        this._memberLookup[myId] = myMember;
        this._peerJsClient = await this._createPeerJsClient(myId, peerJsConfig, { isHosting: true, lobbyMemberIds: [ myId ] });

        this.setState({
            lobbyId,
            myId: lobbyId,
            displayName,
            isHosting: true,
            lobbyMemberIds: [ myId ], // flush lobby member when hosting
        });
    }

    // Join lobby
    // TODO: handle the case that joined non-existing lobbyId
    _handlePeerJsRegisterJoin = async (event, lobbyId, displayName) => {
        const myId = nanoid();
        const myMember = new Member(myId, displayName, false);
        const { peerJsConfig } = this.state;

        this._memberLookup[myId] = myMember;
        this._peerJsClient = await this._createPeerJsClient(myId, peerJsConfig, { isHosting: false, lobbyMemberIds: [] });

        await this._connectToLobby(lobbyId, myId, displayName);

        // wait until the host ack and update member
        this.setState((state) => ({
            lobbyId,
            myId,
            displayName,
            isHosting: false,
            lobbyMemberIds: [ myId ], // flush lobby member when joining
        }));
    }

    _handleConfigUpdate = (event, host, port, path, debug) => {
        event.preventDefault();

        this.setState({
            peerJsConfig: {
                host,
                port,
                path,
                debug,
            },
        });
    }

    render() {
        const { showReduxConnectionInfo } = this.props;

        const {
            peerJsConfig,
            myId,
            team1,
            team2,
            lobbyMemberIds,
            errorMessage,

            lobbyId,
        } = this.state;

        const teamInfoList = [team1, team2];
        const isUserRegistered = Boolean(myId);

        return (
            <div className={styles.rootContainer}>
                <p>Peerjs in use</p>
                <p>config: { JSON.stringify(peerJsConfig) }</p><br />
                <p>lobbyMemberIds: { JSON.stringify(lobbyMemberIds) }</p>
                <p>lobbyId: { lobbyId }</p>
                <p>team1: { JSON.stringify(team1) }</p>
                <p>team2: { JSON.stringify(team2) }</p>
                { errorMessage ? (
                    <p className={styles.errorMessage}>
                        { errorMessage }
                    </p>
                ) : null}
                <br />
                { isUserRegistered ? null : (
                    <PeerJsConfigForm
                        onSubmit={this._handleConfigUpdate}
                    />
                )}
                { isUserRegistered ? null : (
                    <PeerJsUserRegisterForm
                        onRegisterHost={this._handlePeerJsRegisterHost}
                        onRegisterJoin={this._handlePeerJsRegisterJoin}
                    />
                )}
                { isUserRegistered ? (
                    <Lobby
                        teamInfoList={teamInfoList}
                        memberLookup={this._memberLookup}
                        lobbyMemberIds={lobbyMemberIds}
                        myId={myId}
                        onReadyButtonClick={this._handleReadyButtonClick}
                    />
                ) : null}

                <button onClick={showReduxConnectionInfo}>debug1: show all redux connectionInfo</button>
                <button onClick={this.showAllConnection}>debug2: show all connection</button>
                <button onClick={this.sendPingMessageToAllConnection}>debug3: ping all connection</button>
            </div>
        );
    }
}

Peer.statics = {
    timeout: null,
};
