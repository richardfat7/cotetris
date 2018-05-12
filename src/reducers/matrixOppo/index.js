import { List } from 'immutable';
import * as reducerType from '../../unit/reducerType';
import { blankMatrix, lastRecord } from '../../unit/const';

const initState = lastRecord && Array.isArray(lastRecord.matrixOppo) ?
  List(lastRecord.matrixOppo.map(e => List(e))) : blankMatrix;

const matrixOppo = (state = initState, action) => {
  switch (action.type) {
    case reducerType.MATRIXOPPO:
      return action.data;
    default:
      return state;
  }
};

export default matrixOppo;
