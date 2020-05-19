import * as reducerType from '../../unit/reducerType';

/**
 * @typedef {object} Member
 * @property {string} id
 * @property {string} displayName
 * @property {bool} isReady
 *
 * @typedef {object} Team
 * @property {string} id only team1 and 2
 * @property {Array<string>} memberIds
 * @property {string} teamColor
 */

const initState = {
    myMember: '',
    lobbyId: '',
    isHosting: false,

    connectionLookup: {},
    connectionConfig: {},

    teamInfo: [],
};
const peerConnection = (state = initState, action) => {
    switch (action.type) {
        case reducerType.PEER_REGISTER:{
            return {
                ...state,
                myMember: action.payload.member,
                lobbyId: action.payload.lobbyId,
                isHosting: action.payload.isHosting,
            };
        }

        case reducerType.PEER_SAVE_TEAM_INFO: {
            return {
                ...state,
                teamInfo: action.payload.teanInfo,
            };
        }

        case reducerType.PEER_SAVE_CONNECTION_CONFIG: {
            return {
                ...state,
                connectionConfig: action.payload.connectionConfig,
            };
        }

        case reducerType.PEER_SAVE_CONNECTION_LOOKUP: {
            return {
                ...state,
                connectionLookup: action.payload.connectionLookup,
            };
        }

        default:
            return state;
    }
};

export default peerConnection;
