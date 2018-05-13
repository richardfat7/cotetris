import * as reducerType from '../../unit/reducerType';

const initState = { conns: [], peer: null };
const peerConnection = (state = initState, action) => {
  const conns = state.conns;
  const peer = state.peer;
  switch (action.type) {
    case reducerType.PEER_SAVE_PEER:
      return { conns, peer: action.data };
    case reducerType.PEER_SAVE_CONNECTION:
      return { peer, conns: action.data };
    default:
      return state;
  }
};

export default peerConnection;
