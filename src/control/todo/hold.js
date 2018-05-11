import { subscribeTile } from '../../unit';
import event from '../../unit/event';
import { blockType } from '../../unit/const';
import actions from '../../actions';
import states from '../states';
import { music } from '../../unit/music';

const down = (store) => {
  store.dispatch(actions.keyboard.hold(true));
  if (store.getState().get('cur') !== null && store.getState().get('canHold') === true) {
    event.down({
      key: 'hold',
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
        if (music.fall) {
          music.fall();
        }
        store.dispatch(actions.lock(false));
        if (state.get('holdType') !== 'E' && state.get('holdType') !== null) {
          store.dispatch(actions.moveBlock({ type: store.getState().get('holdType') }));
        } else {
          store.dispatch(actions.moveBlock({ type: store.getState().get('next') }));
          store.dispatch(actions.nextBlock(store.getState().get('bag').first()));
          store.dispatch(actions.shiftNextBlock());
        }
        store.dispatch(actions.holdType(blockType.indexOf(cur.type)));
        states.auto();
        subscribeTile(store);
        store.dispatch(actions.canHold(false));
      },
    });
  }
};

const up = (store) => {
  store.dispatch(actions.keyboard.hold(false));
  event.up({
    key: 'hold',
  });
};

export default {
  down,
  up,
};
