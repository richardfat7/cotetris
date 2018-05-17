import * as reducerType from '../../unit/reducerType';

const initState = 0;

const linesReceived = (state = initState, action) => {
  switch (action.type) {
    case reducerType.LINES_RECEIVED:
      if (action.data === -1) {
        return 0;
      }
      return action.data + state; // add
    default:
      return state;
  }
};

export default linesReceived;
