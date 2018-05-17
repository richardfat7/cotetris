import { List } from 'immutable';
import * as reducerType from '../../unit/reducerType';
import { blankMatrix, lastRecord } from '../../unit/const';

const initState = lastRecord && Array.isArray(lastRecord.tempMatrix2) ?
  List(lastRecord.tempMatrix2.map(e => List(e))) : blankMatrix;

const tempMatrix2 = (state = initState, action) => {
  switch (action.type) {
    case reducerType.TEMP_MATRIX2:
      return action.data;
    default:
      return state;
  }
};

export default tempMatrix2;
