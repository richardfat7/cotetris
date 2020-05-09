import { subscribeTile } from '../../unit';
import event from '../../unit/event';
import { blockType } from '../../unit/const';
import actions from '../../actions';
import states from '../states';
import { music } from '../../unit/music';

const down = (store) => {
    store.dispatch(actions.keyboard.down(true));

    const myplayerid = store.getState().get('myplayerid');
    const state = store.getState();
    let curV;

    if (myplayerid === 0) {
        curV = 'cur';
    } else if (myplayerid === 1) {
        curV = 'cur2';
    } else if (myplayerid === 2) {
        curV = 'cur';
    } else if (myplayerid === 3) {
        curV = 'cur2';
    }

    let cur = state.get(curV);

    store.dispatch(actions.keyboard.hold(true));
    if (cur !== null && state.get('canHold') === true) {
        event.down({
            key: 'hold',
            once: true,
            callback: () => {
                if (state.get('lock')) {
                    return;
                }

                if (state.get('pause')) {
                    states.pause(false);
                }

                cur = state.get(curV);
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
                store.dispatch(actions.resetLockDelay());
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
