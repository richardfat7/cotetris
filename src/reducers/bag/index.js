import { List } from 'immutable';
import * as reducerType from '../../unit/reducerType';
import { lastRecord, blockType } from '../../unit/const';

const initState = (() => {
  if (!lastRecord || !lastRecord.bag) { // 无记录 或 有记录 但方块为空, 返回 new bag
    let bigbag = List();
    const len = blockType.length - 1;
    for (let j = 0; j < 100; j++) {
      let bag = List();
      for (let i = 0; i < len; i++) {
        bag = bag.push(blockType[i]);
      }
      bag = bag.sortBy(Math.random);
      for (let i = 0; i < len; i++) {
        bigbag = bigbag.push(bag[i]);
      }
    }
    return bigbag;
  }
  return List(lastRecord.bag);
})();

const bag = (state = initState, action) => {
  switch (action.type) {
    case reducerType.SHIFT_TWICE: {
      let sbag = state;
      sbag = sbag.shift().shift().shift();
      if (sbag.size < 7) {
        let newBag = List();
        const len = blockType.length - 1;
        for (let i = 0; i < len; i++) {
          newBag = newBag.push(blockType[i]);
        }
        newBag = newBag.sortBy(Math.random);
        sbag = sbag.concat(newBag);
      }
      return sbag;
    }
    case reducerType.SHIFT_NEXT_BLOCK: {
      let sbag = state;
      sbag = sbag.shift();
      if (sbag.size < 7) {
        let newBag = List();
        const len = blockType.length - 1;
        for (let i = 0; i < len; i++) {
          newBag = newBag.push(blockType[i]);
        }
        newBag = newBag.sortBy(Math.random);
        sbag = sbag.concat(newBag);
      }
      return sbag;
    }
    case reducerType.RESET_BAG: {
      let sbag = List();
      const len = blockType.length - 1;
      for (let i = 0; i < len; i++) {
        sbag = sbag.push(blockType[i]);
      }
      sbag = sbag.sortBy(Math.random);
      return sbag;
    }
    default:
      return state;
  }
};

export default bag;
