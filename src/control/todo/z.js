import { want } from '../../unit/';
import event from '../../unit/event';
import actions from '../../actions';
import states from '../states';
import { music } from '../../unit/music';

const down = (store) => {
  store.dispatch(actions.keyboard.z(true));
  if (store.getState().get('cur') !== null) {
    event.down({
      key: 'z',
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
        let next;
        for (let i = 0; i < 5; i++) {
          next = cur.z(i);
          if (want(next, state.get('matrix'))) {
            store.dispatch(actions.moveBlock(next));
            store.dispatch(actions.resetLockDelay());
            break;
          }
        }
      },
    });
  }
};

const up = (store) => {
  store.dispatch(actions.keyboard.z(false));
  event.up({
    key: 'z',
  });
};

export default {
  down,
  up,
};
