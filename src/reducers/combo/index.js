import * as reducerType from '../../unit/reducerType';
import { lastRecord } from '../../unit/const';

let initState = lastRecord && !isNaN(parseInt(lastRecord.clearLines, 10)) ?
    parseInt(lastRecord.clearLines, 10) : -1;

if (initState < -1) {
    initState = -1;
}

const combo = (state = initState, action) => {
    switch (action.type) {
        case reducerType.COMBO:
            return action.data;
        default:
            return state;
    }
};

export default combo;
