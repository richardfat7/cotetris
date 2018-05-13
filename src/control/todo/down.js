import { want } from '../../unit/';
import event from '../../unit/event';
import actions from '../../actions';
import states from '../states';
import { music } from '../../unit/music';

const down = (store) => {
  store.dispatch(actions.keyboard.down(true));
  if (store.getState().get('cur') !== null) {
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
        const cur = state.get('cur');
        if (cur === null) {
          return;
        }
        if (state.get('pause')) {
          states.pause(false);
          return;
        }
        const next = cur.fall();
        if (want(next, state.get('matrix'))) {
          store.dispatch(actions.moveBlock(next));
          store.dispatch(actions.resetLockDelay());
          states.auto();
        } else {
          if (state.get('lockDelay').startTime !== null) {
            store.dispatch(actions.updateLockDelay());
          } else {
            store.dispatch(actions.startLockDelay());
          }
          if (store.getState().get('lockDelay').shouldLock) {
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
            shape.forEach((m) => {
              if (xy.get(0) + m.get(1) >= 0) { // 竖坐标可以为负
                let line = matrix.get(xy.get(0) + m.get(1));
                line = line.set(xy.get(1) + m.get(0), color);
                matrix = matrix.set(xy.get(0) + m.get(1), line);
              }
            });
            states.nextAround(matrix, stopDownTrigger);
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
        const cur = state.get('cur');
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
