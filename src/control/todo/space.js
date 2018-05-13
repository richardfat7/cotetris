import { want } from '../../unit/';
import event from '../../unit/event';
import actions from '../../actions';
import states from '../states';
import { music } from '../../unit/music';
import * as reducerType from '../../unit/reducerType';

const down = (store) => {
  store.dispatch(actions.keyboard.drop(true));
  const peerState = store.getState().get('peerConnection');
  const myplayerid = store.getState().get('myplayerid');
  if (peerState.conns) {
    for (let i = 0; i < peerState.conns.length; i++) {
      // later should a sequence number to reorder packet by us
      const data = { label: 'movement', payload: 'space', playerid: myplayerid };
      peerState.conns[i].send(JSON.stringify(data));
    }
  }
  event.down({
    key: 'space',
    once: true,
    callback: () => {
      const state = store.getState();
      if (state.get('lock')) {
        return;
      }
      let curV; let type;
      if (myplayerid === 0) {
        curV = 'cur';
        type = reducerType.MOVE_BLOCK;
      } else if (myplayerid === 1) {
        curV = 'cur2';
        type = reducerType.MOVE_BLOCK2;
      } else if (myplayerid === 2) {
        curV = 'curOppo';
        type = reducerType.MOVE_BLOCK_OPPO;
      } else if (myplayerid === 3) {
        curV = 'curOppo2';
        type = reducerType.MOVE_BLOCK_OPPO2;
      }
      const cur = state.get(curV);
      if (cur !== null) { // 置底
        if (state.get('pause')) {
          states.pause(false);
          return;
        }
        if (music.fall) {
          music.fall();
        }
        let index = 0;
        let bottom = cur.fall(index);
        while (want(bottom, state.get('matrix'))) {
          bottom = cur.fall(index);
          index++;
        }
        let matrix = state.get('matrix');
        bottom = cur.fall(index - 2);
        store.dispatch(actions.moveBlockGeneral(bottom, type));
        const shape = bottom.shape;
        const xy = bottom.xy;
        let color;
        if (cur.type === 'I') {
          color = 3;
        } else if (cur.type === 'O') {
          color = 4;
        } else if (cur.type === 'T') {
          color = 5;
        } else if (cur.type === 'S') {
          color = 6;
        } else if (cur.type === 'Z') {
          color = 7;
        } else if (cur.type === 'J') {
          color = 8;
        } else if (cur.type === 'L') {
          color = 9;
        } else {
          color = 1;
        }
        shape.forEach((m, k1) => (
          m.forEach((n, k2) => {
            if (n && xy[0] + k1 >= 0) { // 竖坐标可以为负
              let line = matrix.get(xy[0] + k1);
              line = line.set(xy[1] + k2, color);
              matrix = matrix.set(xy[0] + k1, line);
            }
          })
        ));
        store.dispatch(actions.drop(true));
        setTimeout(() => {
          store.dispatch(actions.drop(false));
        }, 100);
        store.dispatch(actions.canHold(true));
        states.nextAround(matrix, null, myplayerid);
      } else {
        states.start();
      }
    },
  });
};

const up = (store) => {
  store.dispatch(actions.keyboard.drop(false));
  event.up({
    key: 'space',
  });
};

export default {
  down,
  up,
};
