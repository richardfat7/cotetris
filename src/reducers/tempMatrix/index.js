import { List } from 'immutable';
import * as reducerType from '../../unit/reducerType';
import { blankMatrix, lastRecord } from '../../unit/const';

const initState = lastRecord && Array.isArray(lastRecord.tempMatrix) ?
    List(lastRecord.tempMatrix.map(e => List(e))) : blankMatrix;

const tempMatrix = (state = initState, action) => {
    switch (action.type) {
        case reducerType.TEMP_MATRIX:
            return action.data;
        default:
            return state;
    }
};

export default tempMatrix;
