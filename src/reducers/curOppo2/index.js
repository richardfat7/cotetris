import { List } from 'immutable';
import * as reducerType from '../../unit/reducerType';
import { lastRecord } from '../../unit/const';
import Block from '../../unit/block';

const initState = (() => {
  if (!lastRecord || !lastRecord.curOppo2) { // 无记录 或 有记录 但方块为空, 返回 null
    return null;
  }
  const curOppo2 = lastRecord.curOppo2;
  const option = {
    type: curOppo2.type,
    rotateIndex: curOppo2.rotateIndex,
    shape: List(curOppo2.shape.map(e => List(e))),
    xy: curOppo2.xy,
  };
  return new Block(option);
})();

const curOppo2 = (state = initState, action) => {
  switch (action.type) {
    case reducerType.MOVE_BLOCK_OPPO2:
      return action.data;
    default:
      return state;
  }
};

export default curOppo2;
