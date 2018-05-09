import * as reducerType from '../../unit/reducerType';
import { lastRecord } from '../../unit/const';

const initState = (lastRecord && lastRecord.canHold !== undefined) ? lastRecord.canHold : true;

const canHold = (state = initState, action) => {
  switch (action.type) {
    case reducerType.CAN_HOLD:
      return action.data;
    default:
      return state;
  }
};

export default canHold;
