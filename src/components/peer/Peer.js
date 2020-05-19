import React from 'react';
import PropTypes from 'prop-types';
import { nanoid } from 'nanoid';

import { List } from 'immutable';
import { Link } from 'react-router-dom';

// Data Model
import Member from '../../model/Member';

// Protocol
import {
    PROTOCOL as CONNECTION_PROTOCOL,
    MessageTypes as ConnectionMessageTypes,

    createConnectToUserMessage, // eslint-disable-line no-unused-vars
    createAckConnectToUserMessage, // eslint-disable-line no-unused-vars
    createRequestConnectionInfoMessage, // eslint-disable-line no-unused-vars
    createResponseConnectionInfoMessage, // eslint-disable-line no-unused-vars

    createAssignTeamMessage, // eslint-disable-line no-unused-vars
    createAckAssignTeamMessage, // eslint-disable-line no-unused-vars
    createChooseTeamMessage, // eslint-disable-line no-unused-vars
    createAckChooseTeamMessage, // eslint-disable-line no-unused-vars

    createReadyMessage, // eslint-disable-line no-unused-vars
    createAckReadyMessage, // eslint-disable-line no-unused-vars
    createInitGameMessage, // eslint-disable-line no-unused-vars
    createAckInitGameMessage, // eslint-disable-line no-unused-vars

    createPingMessage, // eslint-disable-line no-unused-vars
    createPongMessage, // eslint-disable-line no-unused-vars
} from '../../protocol/Connection';
import * as ConnectionHandlers from '../../protocol/ConnectionHandlers';
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

export default class Peer extends React.Component {
    static propTypes = {
        history: PropTypes.object,
        cur: PropTypes.bool,
        max: PropTypes.number,
        point: PropTypes.number,

        onRegister: PropTypes.func.isRequired,
        onSaveTeamInfo: PropTypes.func.isRequired,
        onSaveConnectionConfig: PropTypes.func.isRequired,
        onSaveConnectionLookup: PropTypes.func.isRequired,

        showReduxConnectionInfo: PropTypes.func.isRequired,
    };

    constructor(props) {
        super(props);

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
            lobbyMembers: [],

            errorMessage: '',
        };

        this._peerJsClient = null;
        this._connectionLookup = {};
    }

    // legacy codes
    shouldComponentUpdate({ cur, point, max }) {
        const props = this.props;

        return cur !== props.cur || point !== props.point || max !== props.max || !props.cur;
    }

    // DEBUG
    showAllConnection = () => {
        const { myId, team1, team2 } = this.state;

        console.log('this._connectionLookup', this._connectionLookup);
        console.log('myId', myId);
        console.log('team1', team1);
        console.log('team2', team2);
    }

    _handlePeerJsClientOpen = (myId, { isHosting, members }) => {
        this.setState({ myId });

        this.props.onRegister(members, myId, isHosting);
    }

    _handlePeerJsClientClose = (err) => {
        this.setState({ errorMessage: 'Peerjs client close, please refresh' });
    }

    _handlePeerJsClientError = (err) => {
        this.setState({ errorMessage: `${err.message} ${err.stack}` });
    }

    _handlePeerJsDataConnectionOpen = (connection) => {
        if (this._connectionLookup[connection.id]) {
            this._handlePeerJsDataConnectionError(`connection for id ${connection.id} exists`);

            return;
        }

        this._connectionLookup[connection.id] = connection;
    }
    _handlePeerJsDataConnectionError = (err, connection) => {
        this.setState({ errorMessage: `${err.message} ${err.stack}` });
    }
    _handlePeerJsDataConnectionClose = (connection) => {
        delete this._connectionLookup[connection.id];

        this.setState({ errorMessage: `Connection ${connection.id} close, please refresh` });
    }
    _handlePeerJsDataConnectionData = (data, connection) => {
        const message = JSON.parse(data);
        const { protocol, type } = message;

        // NOTE: protocol is not fully implemented yet
        // if (!type || !protocol || !from) {
        //     this.setState({ errorMessage: 'message does not fit protocol' });

        //     return;
        // }
        const myplayerid = store.getState().get('myplayerid');

        if (protocol === CONNECTION_PROTOCOL) {
            if (type === ConnectionMessageTypes.CONNECT_TO_USER) {
                ConnectionHandlers.handleConnectToUser(data, this._connectionLookup);
            } else if (type === ConnectionMessageTypes.ACK_CONNECT_TO_USER) {
                ConnectionHandlers.handleAckConnectToUser(data, this._connectionLookup);
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

    _connectToLobby = async (lobbyId) => {
        const { myId, displayName } = this.state;

        const connection = this._peerJsClient.connect(lobbyId);

        await this._handlePeerJsClientConnection(connection);

        connection.send(createConnectToUserMessage(myId, { displayName }));

        return Promise.resolve();
    }

    _handlePeerJsClientConnection = async (connection) => {
        await initConnection(connection, {
            onOpen: (id, connection) => {
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

    _createPeerJsClient = async (myId, peerJsConfig, { isHosting, members }) => {
        return await initPeerJsClient(myId, peerJsConfig, {
            onOpen: (id, peerJsClient) => {
                this._handlePeerJsClientOpen(myId, { isHosting, members });
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

    _handlePeerJsRegisterHost = async (event, lobbyId, displayName) => {
        const myId = lobbyId;
        const myMember = new Member(myId, displayName, false);
        const { peerJsConfig } = this.state;

        this._peerJsClient = await this._createPeerJsClient(myId, peerJsConfig, { isHosting: true, members: [myMember] });

        this.setState((state) => ({
            lobbyId,
            myId: lobbyId,
            displayName,
            isHosting: true,
            lobbyMembers: [...state.lobbyMembers, myMember ],
        }));
    }

    _handlePeerJsRegisterJoin = async (event, lobbyId, displayName) => {
        const myId = nanoid();
        const myMember = new Member(myId, displayName, false);
        const { peerJsConfig } = this.state;

        this._peerJsClient = await this._createPeerJsClient(myId, peerJsConfig, { isHosting: false, members: [] });

        await this._connectToLobby(lobbyId);

        // wait until the host ack and update member
        this.setState((state) => ({
            lobbyId,
            myId,
            displayName,
            isHosting: false,
            lobbyMembers: [...state.lobbyMembers, myMember ],
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
            lobbyMembers,
            errorMessage,

            lobbyId,
        } = this.state;

        const teamInfoList = [team1, team2];
        const isUserRegistered = Boolean(myId);

        return (
            <div className={styles.rootContainer}>
                <p>Peerjs in use</p>
                <p>config: { JSON.stringify(peerJsConfig) }</p><br />
                <p>lobbyMembers: { JSON.stringify(lobbyMembers) }</p>
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
                        lobbyMembers={lobbyMembers}
                    />
                ) : null}
                <Link
                    to={{
                        pathname: '/tetris',
                    }}
                >Home</Link>

                <button onClick={showReduxConnectionInfo}>debug1: show all redux connectionInfo</button>
                <button onClick={this.showAllConnection}>debug2: show all connection</button>
            </div>
        );
    }
}

Peer.statics = {
    timeout: null,
};
