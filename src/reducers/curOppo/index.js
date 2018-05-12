import { List } from 'immutable';
import * as reducerType from '../../unit/reducerType';
import { lastRecord } from '../../unit/const';
import Block from '../../unit/block';

const initState = (() => {
  if (!lastRecord || !lastRecord.curOppo) { // 无记录 或 有记录 但方块为空, 返回 null
    return null;
  }
  const curOppo = lastRecord.curOppo;
  const option = {
    type: curOppo.type,
    rotateIndex: curOppo.rotateIndex,
    shape: List(curOppo.shape.map(e => List(e))),
    xy: curOppo.xy,
  };
  return new Block(option);
})();

const cur = (state = initState, action) => {
  switch (action.type) {
    case reducerType.MOVE_BLOCK_OPPO:
      return action.data;
    default:
      return state;
  }
};

export default cur;
