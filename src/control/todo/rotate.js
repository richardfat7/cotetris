import { want } from '../../unit/';
import event from '../../unit/event';
import actions from '../../actions';
import states from '../states';
import { music } from '../../unit/music';
import * as reducerType from '../../unit/reducerType';

const down = (store) => {
  const peerState = store.getState().get('peerConnection');
  const myplayerid = store.getState().get('myplayerid');
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
  if (peerState.conns) {
    for (let i = 0; i < peerState.conns.length; i++) {
      // later should a sequence number to reorder packet by us
      const data = { label: 'movement', payload: 'rotate', playerid: myplayerid };
      peerState.conns[i].send(JSON.stringify(data));
    }
  }
  store.dispatch(actions.keyboard.rotate(true));
  if (store.getState().get('cur') !== null) {
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
        const cur = state.get('cur');
        if (cur === null) {
          return;
        }
        if (music.rotate) {
          music.rotate();
        }
        const next = cur.rotate();
        if (want(next, state.get('matrix'))) {
          store.dispatch(actions.moveBlockGeneral(next, type));
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
