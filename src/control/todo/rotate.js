import { want, senddata } from '../../unit/';
import event from '../../unit/event';
import actions from '../../actions';
import states from '../states';
import { music } from '../../unit/music';
import * as reducerType from '../../unit/reducerType';

const down = (store, id = null) => {
  const peerState = store.getState().get('peerConnection');
  const myplayerid = id === null ? store.getState().get('myplayerid') : id;
  if (myplayerid % 2 === 1 && id === null) {
    senddata(peerState.conns, { label: 'syncmove', key: 'rotate', id: myplayerid });
  } else {
    store.dispatch(actions.keyboard.rotate(true));
    let curV;
    let curV2;
    let tmpMatrix;
    let type;
    let type2;
    if (myplayerid === 0) {
      curV = 'cur';
      curV2 = 'cur2';
      tmpMatrix = 'tempMatrix';
      type = reducerType.MOVE_BLOCK;
      type2 = reducerType.MOVE_BLOCK2;
    } else if (myplayerid === 1) {
      curV = 'cur2';
      curV2 = 'cur';
      tmpMatrix = 'tempMatrix';
      type = reducerType.MOVE_BLOCK2;
      type2 = reducerType.MOVE_BLOCK;
    } else if (myplayerid === 2) {
      curV = 'cur';
      curV2 = 'cur2';
      tmpMatrix = 'tempMatrix';
      type = reducerType.MOVE_BLOCK;
      type2 = reducerType.MOVE_BLOCK2;
    } else if (myplayerid === 3) {
      curV = 'cur2';
      curV2 = 'cur';
      tmpMatrix = 'tempMatrix';
      type = reducerType.MOVE_BLOCK2;
      type2 = reducerType.MOVE_BLOCK;
    }
    if (store.getState().get(curV) !== null) {
      event.down({
        key: 'rotate',
        once: true,
        callback: () => {
          const state = store.getState();
          if (state.get('lock')) {
            return;
          }
          if (state.get('pause')) {
            states.pause(false);
          }
          const cur = state.get(curV);
          const cur2 = state.get(curV2);
          if (cur === null) {
            return;
          }
          if (music.rotate) {
            music.rotate();
          }
          let next;
          for (let i = 0; i < 5; i++) {
            next = cur.rotate(i);
            const xy = next.xy;
            const xy2 = cur2.xy;
            if (want(next, state.get('matrix'))) {
              let tMatrix = state.get(tmpMatrix);
              const tshape = cur2 && cur2.shape;
              const txy = cur2 && cur2.xy;
              tshape.forEach((m) => {
                if (txy.get(0) + m.get(1) >= 0) { // 竖坐标可以为负
                  let line = tMatrix.get(txy.get(0) + m.get(1));
                  line = line.set(txy.get(1) + m.get(0), 1);
                  tMatrix = tMatrix.set(txy.get(0) + m.get(1), line);
                }
              });
              if (want(next, tMatrix)) {
                store.dispatch(actions.moveBlockGeneral(next, type));
                store.dispatch(actions.resetLockDelay());
              }
              if (!want(next, tMatrix)) {
                if (xy[1] < xy2.get(1) && want(cur2.right(), state.get(tmpMatrix))) {
                  store.dispatch(actions.moveBlockGeneral(cur2.right(), type2));
                  store.dispatch(actions.moveBlockGeneral(next, type));
                  store.dispatch(actions.resetLockDelay());
                } else if (xy[1] > xy2.get(1) && want(cur2.left(), state.get(tmpMatrix))) {
                  store.dispatch(actions.moveBlockGeneral(cur2.left(), type2));
                  store.dispatch(actions.moveBlockGeneral(next, type));
                  store.dispatch(actions.resetLockDelay());
                }
              }
              break;
            }
          }
        },
      });
    } else {
      event.down({
        key: 'rotate',
        begin: 200,
        interval: 100,
        callback: () => {
          if (store.getState().get('lock')) {
            return;
          }
          if (music.move) {
            music.move();
          }
          const state = store.getState();
          const cur = state.get(curV);
          if (cur) {
            return;
          }
          let startLines = state.get('startLines');
          startLines = startLines + 1 > 10 ? 0 : startLines + 1;
          store.dispatch(actions.startLines(startLines));
        },
      });
    }
  }
};

const up = (store) => {
  store.dispatch(actions.keyboard.rotate(false));
  event.up({
    key: 'rotate',
  });
};

export default {
  down,
  up,
};
