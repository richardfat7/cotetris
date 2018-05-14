import * as reducerType from '../../unit/reducerType';

const initState = { conns: [], peer: null, connsTarget: [] };
const peerConnection = (state = initState, action) => {
  const conns = state.conns;
  const connsTarget = state.connsTarget;
  const peer = state.peer;
  switch (action.type) {
    case reducerType.PEER_SAVE_PEER:
      return { conns, connsTarget, peer: action.data };
    case reducerType.PEER_SAVE_CONNECTION:
      return { peer, connsTarget: action.data.target, conns: action.data.conn };
    default:
      return state;
  }
};

export default peerConnection;
