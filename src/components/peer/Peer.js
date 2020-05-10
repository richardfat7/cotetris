import React from 'react';
import Peerjs from 'peerjs';
import PropTypes from 'prop-types';

import { List } from 'immutable';
import { Link } from 'react-router-dom';

import PeerJsConfigForm from './PeerJsConfigForm';
import PeerJsConnectionForm from './PeerJsConnectionForm';

import {
    PROTOCOL as CONNECTION_PROTOCOL,
    messageTypes as ConnectionMessageTypes,
    createPeerConnectionInfoMessage,
    createNotifyPeerConnectionInfoMessage,
    createConnectToTeammateMessage,
    createConnectToOpponentLeaderMessage,
    createConnectToOpponentTeammateMessage,
    createAckConnectToTeammateMessage,
    createAckConnectToOpponentLeaderMessage,
    createAckConnectToOpponentTeammateMessage,
} from '../../protocol/Connection';

import store from '../../store';
import todo from '../../control/todo';
import actions from '../../actions';

import * as reducerType from '../../unit/reducerType';

import styles from './index.less';

// NOTE: leader = the one initiate connection to teammate
export default class Peer extends React.Component {
    static propTypes = {
        history: PropTypes.object,
        cur: PropTypes.bool,
        max: PropTypes.number,
        point: PropTypes.number,

        peerSaveMyId: PropTypes.func.isRequired,
        peerSaveLeaderId: PropTypes.func.isRequired,
        peerSaveTeammateId: PropTypes.func.isRequired,
        peerSaveOpponentLeaderId: PropTypes.func.isRequired,
        peerSaveOpponentTeammateId: PropTypes.func.isRequired,
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

            shouldLockConfig: false,
            shouldLockMyId: false,
            shouldLockTeammateId: true,
            shouldLockOpponentLeaderId: true,

            currentplayerid: 0,
            myId: '',
            leaderId: '',
            teammateId: '',
            opponentLeaderId: '',
            opponentTeammateId: '',
            errorMessage: '',
        };

        this._peerJsClient = null;
        this._leaderConnection = null;
        this._teammateConnection = null;
        this._opponentLeaderConnection = null;
        this._opponentTeammateConnection = null;
        this._connectionLookup = {};
    }

    shouldComponentUpdate({ cur, point, max }) {
        const props = this.props;

        return cur !== props.cur || point !== props.point || max !== props.max || !props.cur;
    }

    _broadcastMessage = (message) => {
        this._leaderConnection && this._leaderConnection.send(message);
        this._teammateConnection && this._teammateConnection.send(message);
        this._opponentLeaderConnection && this._opponentLeaderConnection.send(message);
        this._opponentTeammateConnection && this._opponentTeammateConnection.send(message);
    }

    _messagerTeamOtherMember = (message) => {
        const { myId, leaderId, teammateId } = this.state;

        if (myId === leaderId) {
            this._teammateConnection.send(message);
        } else if (myId === teammateId) {
            this._leaderConnection.send(message);
        }
    }

    /**
     * NOTE: To use the connection lobby
     * 1. Team leaders invite teammates
     * 2. One of the team leader initiate fight with another team leader
     * (TODO: make connect with opponent teammates work too)
     * im just toooooo lazy to think it through *sob*
     */
    _handleAcceptTeammateRequest = (conn, messageFrom) => {
        const { myId } = this.state;

        this._teammateConnection = conn;
        this._connectionLookup[messageFrom] = conn;
        this.props.peerSaveMyId({ id: myId, role: 'LEADER' });
        this.props.peerSaveTeammateId(messageFrom);
        this.setState((state) => ({
            leaderId: state.myId,
            teammateId: messageFrom,
            shouldLockTeammateId: true,
            shouldLockOpponentLeaderId: false,
        }));
    }

    _handleAcceptOpponentLeaderRequest = (conn, messageFrom, opponentLeaderId, opponentTeammateId) => {
        const { myId } = this.state;

        this._connectionLookup[messageFrom] = conn;
        this.props.peerSaveOpponentLeaderId(opponentLeaderId);

        this.setState((state) => ({
            opponentLeaderId,
        }));

        if (opponentTeammateId) {
            this.setState((state) => ({
                opponentTeammateId,
            }));
            this.props.peerSaveOpponentTeammateId(opponentTeammateId);
        }

        this._messagerTeamOtherMember(createNotifyPeerConnectionInfoMessage(myId, opponentLeaderId, opponentTeammateId));
    }

    _handleAcceptOpponentTeammateRequest = (conn, messageFrom) => {
        this._connectionLookup[messageFrom] = conn;
        this.props.peerSaveOpponentTeammateId(messageFrom);
        this.setState((state) => ({
            opponentTeammateId: messageFrom,
        }));
    }

    // ...maybe 3 way ack later?
    _handleConnectionInfoNotification = (conn, opponentLeaderId, opponentTeammateId) => {
        this.setState({
            opponentLeaderId,
            opponentTeammateId,
        });
    }

    // only leader send invitations
    _handleTeamInvitationRequest = (conn, leaderId) => {
        if (this._leaderConnection) {
            this.setState({
                errorMessage: 'leader connection already exists',
            });

            return;
        }

        const { myId } = this.state;

        // only leader allow to initiate fight with opponent
        this.setState({ leaderId, teammateId: myId, shouldLockTeammateId: true, shouldLockOpponentLeaderId: true });
        this.props.peerSaveMyId({ id: myId, role: 'TEAMMATE' });
        this.props.peerSaveLeaderId(leaderId);

        conn.send(createAckConnectToTeammateMessage(myId));
        conn.__cotetris_params.id = leaderId;
        this._leaderConnection = conn;
        this._connectionLookup[leaderId] = conn;
    }

    // assume no opponent teammate is connected before leader is connected
    _handleOpponentLeaderInvitationRequest = async (conn, opponentId, opponentLeaderId, opponentTeammateId = null) => {
        if (this._opponentLeaderConnection) {
            this.setState({
                errorMessage: 'opponent leader connection already exists',
            });

            return;
        }

        const { myId, leaderId, teammateId } = this.state;

        this.setState({
            opponentLeaderId,
            opponentTeammateId,
        });

        if (opponentTeammateId) {
            // TODO: attempt to connect to opponent
            const conn = this._peerJsClient.connect(opponentTeammateId);

            await this._initConnection(conn, {
                onOpen: () => conn.send(createConnectToOpponentTeammateMessage(myId, leaderId, teammateId, { referrer: 'opponent team leader' })),
            });
        }

        this.props.peerSaveOpponentLeaderId = opponentLeaderId;
        conn.send(createAckConnectToOpponentLeaderMessage(myId, leaderId, teammateId));
        conn.__cotetris_params.id = opponentLeaderId;
        this._opponentLeaderConnection = conn;
        this._connectionLookup[opponentId] = conn;

        this._messagerTeamOtherMember(createNotifyPeerConnectionInfoMessage(myId, opponentLeaderId, opponentTeammateId));
    }

    _handleOpponentTeammateInvitationRequest = (conn, opponentTeammateId) => {
        if (this._opponentTeammateConnection) {
            this.setState({
                errorMessage: 'opponent teammate connection already exists',
            });

            return;
        }

        const { myId } = this.state;

        this.props.peerSaveOpponentTeammateId = opponentTeammateId;
        conn.send(createAckConnectToOpponentTeammateMessage(myId));
        conn.__cotetris_params.id = opponentTeammateId;
        this._opponentTeammateConnection = conn;
        this._connectionLookup[opponentTeammateId] = conn;
    }

    // options: onOpen, onClose, onError
    _initConnection = async (conn, options = {}) => {
        await new Promise((resolve) => {
            conn.on('open', () => {
                conn.__cotetris_params = {};

                options.onOpen && options.onOpen();
                console.log('peerjs connection on open');

                resolve();
            });
        });
        conn.on('data', async (res) => {
            const data = JSON.parse(res);
            const { protocol, type, payload, from: messageFrom } = data;

            // NOTE: protocol is not fully implemented yet
            // if (!type || !protocol) {
            //     this.setState({ errorMessage: 'message does not fit protocol' });

            //     return;
            // }


            const myplayerid = store.getState().get('myplayerid');

            if (protocol === CONNECTION_PROTOCOL) {
                if (type === ConnectionMessageTypes.REQUEST_CONNECT_TO_TEAMMATE) {
                    await this._handleTeamInvitationRequest(conn, messageFrom);
                } else if (type === ConnectionMessageTypes.REQUEST_CONNECT_TO_OPPONENT_LEADER) {
                    await this._handleOpponentLeaderInvitationRequest(conn, messageFrom, payload.leaderId, payload.teammateId);
                } else if (type === ConnectionMessageTypes.REQUEST_CONNECT_TO_OPPONENT_TEAMMATE) {
                    await this._handleOpponentTeammateInvitationRequest(conn, messageFrom, payload.leaderId, payload.teammateId);
                } else if (type === ConnectionMessageTypes.ACK_CONNECT_TO_TEAMMATE) {
                    await this._handleAcceptTeammateRequest(conn, messageFrom);
                } else if (type === ConnectionMessageTypes.ACK_CONNECT_TO_OPPONENT_LEADER) {
                    await this._handleAcceptOpponentLeaderRequest(conn, messageFrom, payload.leaderId, payload.teammateId);
                } else if (type === ConnectionMessageTypes.ACK_CONNECT_TO_OPPONENT_TEAMMATE) {
                    await this._handleAcceptOpponentTeammateRequest(conn, messageFrom);
                } else if (type === ConnectionMessageTypes.NOTIFY_PEER_CONNECTION_INFO) {
                    await this._handleConnectionInfoNotification(conn, payload.opponentLeaderId, payload.opponentTeammateId);
                }
            } else if (data.label === 'syncmove') {
                todo[data.key].down(store, data.id);
                todo[data.key].up(store);
            } else if (data.label === 'linesSent') {
                if (data.team === ((myplayerid <= 1) ? 'LEFT' : 'RIGHT')) {
                    store.dispatch({ type: reducerType.LINES_RECEIVED, data: data.data });
                }
            } else if (data.label === 'syncgame') {
                if (data.team === ((myplayerid <= 1) ? 'LEFT' : 'RIGHT')) {
                    if (data.attr === 'matrix') {
                        // console.log('matrix');
                        let newMatrix = List();

                        data.data.forEach((m) => {
                            newMatrix = newMatrix.push(List(m));
                        });
                        store.dispatch(actions.matrix(newMatrix));
                    } else if (data.attr === 'cur2') {
                        // console.log('cur2');
                        const newCur = data.data;
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
                    } else if (data.attr === 'cur') {
                        const newCur = data.data;
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
                } else if (data.team !== ((myplayerid <= 1) ? 'LEFT' : 'RIGHT')) {
                    if (data.attr === 'matrix') {
                        // console.log('matrix');
                        let newMatrix = List();

                        data.data.forEach((m) => {
                            newMatrix = newMatrix.push(List(m));
                        });
                        store.dispatch(actions.matrixOppo(newMatrix));
                    } else if (data.attr === 'cur2') {
                        // console.log('cur2');
                        const newCur = data.data;
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
                    } else if (data.attr === 'cur') {
                        const newCur = data.data;
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
        });

        conn.on('close', () => {
            conn.close();

            console.log('connection is closed');
            options.onClose && options.onClose();

            this.setState({ errorMessage: 'connection is closed' });
        });

        conn.on('error', (err) => {
            conn.close();

            console.log('connection error', err);
            options.onError && options.onError(err);

            this.setState({ errorMessage: err });
        });
    }

    _handleRegisterSelf =async (event, myId) => {
        try {
            console.log('_handleRegisterSelf', myId);

            const { peerJsConfig } = this.state;
            const peer = new Peerjs(myId, peerJsConfig);

            this._peerJsClient = peer;
            // window.__COTETRIS_PEERJS_CLIENT = peer;

            this._peerJsClient.on('open', (id) => {
                // success
                console.log('peerJsClient on open');

                this.setState({
                    myId: myId ? myId : id, // fallback for user without an id
                    shouldLockConfig: true,
                    shouldLockMyId: true,
                    shouldLockTeammateId: false,
                    shouldLockOpponentLeaderId: true,
                });

                store.dispatch(actions.peerSaveMyId(id));
            });
            this._peerJsClient.on('error', (err) => {
                this.setState({
                    errorMessage: err,
                    shouldLockConfig: true,
                    shouldLockMyId: true,
                    shouldLockTeammateId: true,
                    shouldLockOpponentLeaderId: true,
                });
            });
            this._peerJsClient.on('close', () => {
                this.setState({
                    errorMessage: 'peerjs connection close, please refresh',
                    shouldLockConfig: false,
                    shouldLockMyId: false,
                    shouldLockTeammateId: false,
                    shouldLockOpponentLeaderId: false,
                });
            });
            this._peerJsClient.on('connection', async (conn) => {
                // somebody initiated connection
                await this._initConnection(conn);
            });
        } catch (err) {
            this.setState({ errorMessage: err.stack });

            return;
        }
    }

    _handleRegisterTeammate = async (event, teammateId) => {
        console.log('_handleRegisterTeammate', teammateId);

        const { myId } = this.state;
        const conn = this._peerJsClient.connect(teammateId);

        await this._initConnection(conn, {
            onOpen: () => conn.send(createConnectToTeammateMessage(myId)),
        });
    }

    _handleRegisterOpponentLeader = async (event, opponentLeaderId) => {
        console.log('_handleRegisterOpponent', opponentLeaderId);

        const { myId, leaderId, teammateId } = this.state;
        const conn = this._peerJsClient.connect(opponentLeaderId);

        await this._initConnection(conn, {
            onOpen: () => conn.send(createConnectToOpponentLeaderMessage(myId, leaderId, teammateId)),
        });
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

    _handleConfigChange = (event) => {
        const name = event.target.name;
        const value = event.target.value;

        if (!['newHost', 'newPath', 'newPort', 'newDebugLevel'].includes(name)) {
            // return irrelevant
            return;
        }

        this.setState({
            [name]: value,
        });
    }

    render() {
        const {
            peerJsConfig,
            myId,
            leaderId,
            teammateId,
            opponentLeaderId,
            opponentTeammateId,
            errorMessage,

            shouldLockConfig,
            shouldLockMyId,
            shouldLockTeammateId,
            shouldLockOpponentLeaderId,
        } = this.state;

        return (
            <div className={styles.rootContainer}>
                <p>Peerjs in use</p>
                <p>config: { JSON.stringify(peerJsConfig) }</p><br />
                <p>myId: { myId }</p>
                <p>leaderId: { leaderId }</p>
                <p>teammateId: { teammateId }</p>
                <p>opponentLeaderId: { opponentLeaderId }</p>
                <p>opponentTeammateId: { opponentTeammateId }</p>
                { errorMessage ? (
                    <p className={styles.errorMessage}>
                        { errorMessage }
                    </p>
                ) : null}
                <PeerJsConfigForm
                    onSubmit={this._handleConfigUpdate}
                    shouldLockConfig={shouldLockConfig}
                />
                <PeerJsConnectionForm
                    onRegisterSelf={this._handleRegisterSelf}
                    onRegisterFriend={this._handleRegisterTeammate}
                    onRegisterOpponent={this._handleRegisterOpponentLeader}
                    shouldLockMyId={shouldLockMyId}
                    shouldLockTeammateId={shouldLockTeammateId}
                    shouldLockOpponentLeaderId={shouldLockOpponentLeaderId}
                    onError={(err) => { console.log(err); }}
                />
                <Link
                    to={{
                        pathname: '/tetris',
                    }}
                >Home</Link>
            </div>
        );
    }
}

Peer.statics = {
    timeout: null,
};
