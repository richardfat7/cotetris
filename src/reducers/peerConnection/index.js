import * as R from 'ramda';
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
    // myMember: '',
    // lobbyId: '',
    // isHosting: false,

    // connectionLookup: {},
    // connectionConfig: {},
    // lobbyMembers: [],

    // teamInfo: [],
};
const peerConnection = (state = initState, action) => {
    switch (action.type) {
        case reducerType.PEER_REGISTER:{
            return {
                ...state,
                myMember: action.payload.member,
                lobbyId: action.payload.lobbyId,
                isHosting: action.payload.isHosting,
                connectionConfig: action.payload.connectionConfig,
            };
        }

        case reducerType.PEER_SAVE_TEAM_INFO: {
            return {
                ...state,
                teamInfo: action.payload.teanInfo,
            };
        }

        case reducerType.PEER_SAVE_CONNECTION_LOOKUP: {
            return {
                ...state,
                connectionLookup: action.payload.connectionLookup,
            };
        }

        // allow to update by same id
        case reducerType.ADD_LOBBY_MEMBER: {
            const member = action.payload.member;
            const targetMemberId = member.id;
            const isTargetMember = R.propEq('id', targetMemberId);
            const memberIndex = R.findIndex(isTargetMember, state.lobbyMembers);
            let newMember;

            if (memberIndex === -1) {
                newMember = R.append(member, state.lobbyMembers);
            } else {
                newMember = R.update(memberIndex, member, state.lobbyMembers);
            }

            return {
                lobbyMembers: newMember,
                ...state,
            };
        }

        case reducerType.REMOVE_LOBBY_MEMBER: {
            const memberIdToRemove = action.payload.memberId;
            const isTargetMember = R.propEq('id', memberIdToRemove);

            return {
                member: R.reject(isTargetMember, state.member),
                ...state,
            };
        }

        default:
            return state;
    }
};

export default peerConnection;
