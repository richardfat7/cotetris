import { want } from '../../unit/';
import event from '../../unit/event';
import actions from '../../actions';
import states from '../states';
import { speeds, delays } from '../../unit/const';
import { music } from '../../unit/music';
import * as reducerType from '../../unit/reducerType';

const down = (store) => {
  store.dispatch(actions.keyboard.right(true));
  const peerState = store.getState().get('peerConnection');
  const myplayerid = store.getState().get('myplayerid');
  event.down({
    key: 'right',
    begin: 200,
    interval: 100,
    callback: () => {
      const state = store.getState();
      if (state.get('lock')) {
        return;
      }
      if (music.move) {
        music.move();
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
      if (cur !== null) {
        if (state.get('pause')) {
          states.pause(false);
          return;
        }
        const next = cur.right();
        const delay = delays[state.get('speedRun') - 1];
        let timeStamp;
        if (want(next, state.get('matrix'))) {
          const lock = store.getState().get('lock');
          if (peerState.teamConns && !lock) {
            for (let i = 0; i < peerState.teamConns.length; i++) {
              // later should a sequence number to reorder packet by us
              const data = { label: 'movement', payload: 'right', from: myplayerid };
              peerState.teamConns[i].send(JSON.stringify(data));
            }
          }
          next.timeStamp += parseInt(delay, 10);
          store.dispatch(actions.moveBlockGeneral(next, type));
          timeStamp = next.timeStamp;
        } else {
          cur.timeStamp += parseInt(parseInt(delay, 10) / 1.5, 10); // 真实移动delay多一点，碰壁delay少一点
          store.dispatch(actions.moveBlockGeneral(cur, type));
          timeStamp = cur.timeStamp;
        }
        const remain = speeds[state.get('speedRun') - 1] - (Date.now() - timeStamp);
        states.auto(remain);
      } else {
        let speed = state.get('speedStart');
        speed = speed + 1 > 6 ? 1 : speed + 1;
        store.dispatch(actions.speedStart(speed));
      }
    },
  });
};

const up = (store) => {
  store.dispatch(actions.keyboard.right(false));
  event.up({
    key: 'right',
  });
};

export default {
  down,
  up,
};
