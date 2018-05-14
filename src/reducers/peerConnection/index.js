import * as reducerType from '../../unit/reducerType';

const initState = { teamConns: [], oppoConns: [], peer: null };
const peerConnection = (state = initState, action) => {
  const teamConns = state.teamConns;
  const peer = state.peer;
  const oppoConns = state.oppoConns;
  switch (action.type) {
    case reducerType.PEER_SAVE_PEER:
      return { teamConns, oppoConns, peer: action.data };
    case reducerType.PEER_SAVE_TEAMMATE:
      return { peer, oppoConns, teamConns: action.data };
    case reducerType.PEER_SAVE_OPPONENT:
      return { peer, teamConns, oppoConns: action.data };
    default:
      return state;
  }
};

export default peerConnection;
