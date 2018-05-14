import { want, wantHardDrop, senddata } from '../../unit/';
import event from '../../unit/event';
import actions from '../../actions';
import states from '../states';
import { music } from '../../unit/music';
import * as reducerType from '../../unit/reducerType';

const down = (store, id = null) => {
  const peerState = store.getState().get('peerConnection');
  const myplayerid = id === null ? store.getState().get('myplayerid') : id;
  if (peerState.conns) {
    for (let i = 0; i < peerState.conns.length; i++) {
      // later should a sequence number to reorder packet by us
      const data = { label: 'movement', payload: 'space', playerid: myplayerid };
      peerState.conns[i].send(JSON.stringify(data));
    }
  }
  if (myplayerid % 2 === 1 && id === null) {
    senddata(peerState.conns, { label: 'syncmove', key: 'space', id: myplayerid });
  } else {
    store.dispatch(actions.keyboard.drop(true));
    event.down({
      key: 'space',
      once: true,
      callback: () => {
        const state = store.getState();
        if (state.get('lock')) {
          return;
        }
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
          curV = 'curOppo';
          curV2 = 'curOppo2';
          tmpMatrix = 'tempMatrix2';
          type = reducerType.MOVE_BLOCK_OPPO;
          type2 = reducerType.MOVE_BLOCK_OPPO2;
        } else if (myplayerid === 3) {
          curV = 'curOppo2';
          curV2 = 'curOppo';
          tmpMatrix = 'tempMatrix2';
          type = reducerType.MOVE_BLOCK_OPPO2;
          type2 = reducerType.MOVE_BLOCK_OPPO;
        }
        const cur = state.get(curV);
        const cur2 = state.get(curV2);
        let collide = false;
        if (cur !== null) { // 置底
          if (state.get('pause')) {
            states.pause(false);
            return;
          }
          if (music.fall) {
            music.fall();
          }
          let index;
          let bottom;
          let matrix = state.get('matrix');
          if (wantHardDrop(cur, cur2)) {
            index = 0;
            bottom = cur2.fall(index);
            while (want(bottom, state.get(tmpMatrix))) {
              bottom = cur2.fall(index);
              index++;
            }
            bottom = cur2.fall(index - 2);
            store.dispatch(actions.moveBlockGeneral(bottom, type2));
            const shape = bottom.shape;
            const xy = bottom.xy;
            let color;
            if (cur2.type === 'I') {
              color = 3;
            } else if (cur2.type === 'O') {
              color = 4;
            } else if (cur2.type === 'T') {
              color = 5;
            } else if (cur2.type === 'S') {
              color = 6;
            } else if (cur2.type === 'Z') {
              color = 7;
            } else if (cur2.type === 'J') {
              color = 8;
            } else if (cur2.type === 'L') {
              color = 9;
            } else {
              color = 1;
            }
            shape.forEach((m) => {
              if (xy[0] + m.get(1) >= 0) { // 竖坐标可以为负
                let line = matrix.get(xy[0] + m.get(1));
                line = line.set(xy[1] + m.get(0), color);
                matrix = matrix.set(xy[0] + m.get(1), line);
              }
            });
            collide = true;
          }
          index = 0;
          bottom = cur.fall(index);
          while (want(bottom, matrix)) {
            bottom = cur.fall(index);
            index++;
          }
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
          shape.forEach((m) => {
            if (xy[0] + m.get(1) >= 0) { // 竖坐标可以为负
              let line = matrix.get(xy[0] + m.get(1));
              line = line.set(xy[1] + m.get(0), color);
              matrix = matrix.set(xy[0] + m.get(1), line);
            }
          });
          store.dispatch(actions.drop(true));
          setTimeout(() => {
            store.dispatch(actions.drop(false));
          }, 100);
          store.dispatch(actions.canHold(true));
          if (collide === false) {
            if (myplayerid === 0) { // NOTE might have bugs
              states.nextAround(matrix, null, myplayerid);
            } else if (myplayerid === 1) {
              states.nextAround(matrix, null, myplayerid);
            } else if (myplayerid === 2) {
              states.nextAround(matrix, null, myplayerid);
            } else if (myplayerid === 3) {
              states.nextAround(matrix, null, myplayerid);
            }
          }
          if (collide === true) {
            if (myplayerid < 2) {
              states.nextAround2(matrix, null, 0);
            } else {
              states.nextAround2(matrix, null, 1);
            }
          }
        } else {
          states.start();
        }
      },
    });
  }
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
