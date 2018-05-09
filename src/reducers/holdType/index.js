import { getNextType } from '../../unit';
import * as reducerType from '../../unit/reducerType';
import { lastTile, blockType } from '../../unit/const';

const initState = lastTile && blockType.indexOf(lastTile.holdType) !== -1 ?
  lastTile.holdType : getNextType(blockType.length - 1);
const parse = (state = initState, action) => {
  switch (action.type) {
    case reducerType.HOLD_TYPE:
      return action.data;
    default:
      return state;
  }
};

export default parse;
