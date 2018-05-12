import { List } from 'immutable';
import * as reducerType from '../../unit/reducerType';
import { lastRecord } from '../../unit/const';
import Block from '../../unit/block';

const initState = (() => {
  if (!lastRecord || !lastRecord.cur2) { // 无记录 或 有记录 但方块为空, 返回 null
    return null;
  }
  const cur2 = lastRecord.cur2;
  const option = {
    type: cur2.type,
    rotateIndex: cur2.rotateIndex,
    shape: List(cur2.shape.map(e => List(e))),
    xy: cur2.xy,
  };
  return new Block(option);
})();

const cur2 = (state = initState, action) => {
  switch (action.type) {
    case reducerType.MOVE_BLOCK:
      return action.data;
    default:
      return state;
  }
};

export default cur2;
