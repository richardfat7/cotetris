import * as reducerType from '../../unit/reducerType';

const initState = {
    myId: '',

    leaderId: '',
    teammateId: '',
    opponentLeaderId: '',
    opponentTeammateId: '',
};
const peerConnection = (state = initState, action) => {
    switch (action.type) {
        case reducerType.PEER_SAVE_MY_ID:
            if (!action.payload.id) return state;

            return {
                ...state,
                myId: action.payload.id,
                leaderId: action.payload.role === 'LEADER' ? action.payload.id : state.leaderId,
                teammateId: action.payload.role === 'TEAMMATE' ? action.payload.id : state.teammateId,
            };
        case reducerType.PEER_SAVE_TEAMMATE_ID:
            if (!action.payload.id) return state;

            return { ...state, teammateId: action.payload.id };
        case reducerType.PEER_SAVE_LEADER_ID:
            if (!action.payload.id) return state;

            return { ...state, leaderId: action.payload.id };
        case reducerType.PEER_SAVE_OPPONENT_LEADER_ID:
            if (!action.payload.id) return state;

            return { ...state, opponentLeaderId: action.payload.id };
        case reducerType.PEER_SAVE_OPPONENT_TEAMMATE_ID:
            if (!action.payload.id) return state;

            return { ...state, opponentTeammate: action.payload.id };
        default:
            return state;
    }
};

export default peerConnection;
