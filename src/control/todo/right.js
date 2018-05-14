import { want, senddata } from '../../unit/';
import event from '../../unit/event';
import actions from '../../actions';
import states from '../states';
import { speeds, delays } from '../../unit/const';
import { music } from '../../unit/music';
import * as reducerType from '../../unit/reducerType';

const down = (store, id = null) => {
  const peerState = store.getState().get('peerConnection');
  const myplayerid = id === null ? store.getState().get('myplayerid') : id;
  if (peerState.conns) {
    for (let i = 0; i < peerState.conns.length; i++) {
      // later should a sequence number to reorder packet by us
      const data = { label: 'movement', payload: 'right', playerid: myplayerid };
      peerState.conns[i].send(JSON.stringify(data));
    }
  }
  if (myplayerid % 2 === 1 && id === null) {
    senddata(peerState.conns, { label: 'syncmove', key: 'right', id: myplayerid });
  } else {
    store.dispatch(actions.keyboard.right(true));
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
        const cur = state.get(curV);
        const cur2 = state.get(curV2);
        if (cur !== null) {
          if (state.get('pause')) {
            states.pause(false);
            return;
          }
          const next = cur.right();
          const delay = delays[state.get('speedRun') - 1];
          let timeStamp;
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
              next.timeStamp += parseInt(delay, 10);
              store.dispatch(actions.moveBlockGeneral(next, type));
              timeStamp = next.timeStamp;
              store.dispatch(actions.resetLockDelay());
            }
            if (!want(next, tMatrix)) {
              if (want(cur2.right(), state.get(tmpMatrix))) {
                store.dispatch(actions.moveBlockGeneral(cur2.right(), type2));
                store.dispatch(actions.moveBlockGeneral(next, type));
                store.dispatch(actions.resetLockDelay());
              } else {
                cur.timeStamp += parseInt(parseInt(delay, 10) / 1.5, 10); // 真实移动delay多一点，碰壁delay少一点
                store.dispatch(actions.moveBlockGeneral(cur, type));
                timeStamp = cur.timeStamp;
              }
            }
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
  }
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
