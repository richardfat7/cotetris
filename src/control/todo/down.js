import { want } from '../../unit/';
import event from '../../unit/event';
import actions from '../../actions';
import states from '../states';
import { music } from '../../unit/music';
import * as reducerType from '../../unit/reducerType';

const down = (store) => {
  store.dispatch(actions.keyboard.down(true));
  const peerState = store.getState().get('peerConnection');
  const myplayerid = store.getState().get('myplayerid');
  if (peerState.conns) {
    for (let i = 0; i < peerState.conns.length; i++) {
      // later should a sequence number to reorder packet by us
      const data = { label: 'movement', payload: 'down', playerid: myplayerid };
      peerState.conns[i].send(JSON.stringify(data));
    }
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
  if (store.getState().get(curV) !== null) {
    event.down({
      key: 'down',
      begin: 40,
      interval: 40,
      callback: (stopDownTrigger) => {
        const state = store.getState();
        if (state.get('lock')) {
          return;
        }
        if (music.move) {
          music.move();
        }
        const cur = state.get(curV);
        if (cur === null) {
          return;
        }
        if (state.get('pause')) {
          states.pause(false);
          return;
        }
        const next = cur.fall();
        if (want(next, state.get('matrix'))) {
          store.dispatch(actions.moveBlockGeneral(next, type));
          states.auto();
        } else {
          let matrix = state.get('matrix');
          const shape = cur.shape;
          const xy = cur.xy;
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
              if (n && xy.get(0) + k1 >= 0) { // 竖坐标可以为负
                let line = matrix.get(xy.get(0) + k1);
                line = line.set(xy.get(1) + k2, color);
                matrix = matrix.set(xy.get(0) + k1, line);
              }
            })
          ));
          if (myplayerid === 0) { // NOTE might have bugs
            states.nextAround(matrix, stopDownTrigger, myplayerid);
          } else if (myplayerid === 1) {
            states.nextAround(matrix, stopDownTrigger, myplayerid);
          } else if (myplayerid === 2) {
            states.nextAround(matrix, stopDownTrigger, myplayerid);
          } else if (myplayerid === 2) {
            states.nextAround(matrix, stopDownTrigger, myplayerid);
          }
        }
      },
    });
  } else {
    event.down({
      key: 'down',
      begin: 200,
      interval: 100,
      callback: () => {
        if (store.getState().get('lock')) {
          return;
        }
        const state = store.getState();
        const cur = state.get(curV);
        if (cur) {
          return;
        }
        if (music.move) {
          music.move();
        }
        let startLines = state.get('startLines');
        startLines = startLines - 1 < 0 ? 10 : startLines - 1;
        store.dispatch(actions.startLines(startLines));
      },
    });
  }
};

const up = (store) => {
  store.dispatch(actions.keyboard.down(false));
  event.up({
    key: 'down',
  });
};


export default {
  down,
  up,
};
