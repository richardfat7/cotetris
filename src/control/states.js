import { List } from 'immutable';
import store from '../store';
import { want, isClear, isOver, senddata } from '../unit/';
import Block from '../unit/block';
import actions from '../actions';
import { speeds,
  blankLine,
  bottomLine,
  blankMatrix,
  clearPoints,
  eachLines,
  blockType,
} from '../unit/const';
import { music } from '../unit/music';

const getColor = (type) => {
  let color;
  if (type === 'I') {
    color = 3;
  } else if (type === 'O') {
    color = 4;
  } else if (type === 'T') {
    color = 5;
  } else if (type === 'S') {
    color = 6;
  } else if (type === 'Z') {
    color = 7;
  } else if (type === 'J') {
    color = 8;
  } else if (type === 'L') {
    color = 9;
  } else {
    color = 1;
  }
  return color;
};

const getStartMatrix = (startLines) => { // 生成startLines
  const getLine = (min, max) => { // 返回标亮个数在min~max之间一行方块, (包含边界)
    const count = parseInt((((max - min) + 1) * Math.random()) + min, 10);
    const line = [];
    for (let i = 0; i < count; i++) { // 插入高亮
      line.push(1);
    }
    for (let i = 0, len = 10 - count; i < len; i++) { // 在随机位置插入灰色
      const index = parseInt(((line.length + 1) * Math.random()), 10);
      line.splice(index, 0, 0);
    }

    return List(line);
  };
  let startMatrix = List([]);

  for (let i = 0; i < startLines; i++) {
    if (i <= 2) { // 0-3
      startMatrix = startMatrix.push(getLine(5, 8));
    } else if (i <= 6) { // 4-6
      startMatrix = startMatrix.push(getLine(4, 9));
    } else { // 7-9
      startMatrix = startMatrix.push(getLine(3, 9));
    }
  }
  for (let i = 0, len = 20 - startLines; i < len; i++) { // 插入上部分的灰色
    startMatrix = startMatrix.unshift(List(blankLine));
  }
  return startMatrix;
};

  // sending lines to opponent
function addPenalty(linesCleared) {
  const linesPerCombo = [0, 1, 1, 2, 2, 2, 3, 4];
  const linesPerCleared = [0, 0, 1, 2, 4];
  const combo = store.getState().get('combo');
  const linesSent = linesPerCombo[Math.min(Math.max(combo, 0), 7)] + linesPerCleared[linesCleared];
  // NOTE TBD: if(linesSent > 0) send linesSent thru peerJS here (?)

  // receviing lines from opponent
  const selfSend = true;
  let linesReceived;
  if (selfSend === true) {
    linesReceived = linesSent; // TBD: get lines sent from opponent (lineReceived)
  }// TBD: add them up here
  let matrix = store.getState().get('matrix');
  const hole = Math.floor((Math.random() * 10));
  for (let i = 0; i < linesReceived; i++) {
    const bottomLineHole = bottomLine.slice(0);
    bottomLineHole[hole] = 0;
    matrix = matrix.splice(0, 1);
    matrix = matrix.push(List(bottomLineHole));
  }
  store.dispatch(actions.matrix(matrix));
  store.dispatch(actions.tempMatrix(matrix));
  store.dispatch(actions.tempMatrix2(matrix));
}

const attributes = ['matrix', 'cur2'];
const currentValues = {};
attributes.forEach((attr) => {
  currentValues[attr] = store.getState().get(attr);
});
function handleChange() {
  const previousValues = Object.assign({}, currentValues);
  attributes.forEach((attr) => {
    currentValues[attr] = store.getState().get(attr);
    if (previousValues[attr] !== currentValues[attr]) {
      console.log(attr, 'changed from', previousValues[attr], 'to', currentValues[attr].toString());
      const peerState = store.getState().get('peerConnection');
      senddata(peerState.conns, { label: 'syncgame', attr, data: currentValues[attr] });
    }
  });
}

const states = {
  // 自动下落setTimeout变量
  fallInterval: null,

  // 游戏开始
  start: () => {
    const peerState = store.getState().get('peerConnection');
    const myplayerid = store.getState().get('myplayerid');
    console.log(peerState);
    senddata(peerState.conns, { label: 'start', playerid: myplayerid });
    store.subscribe(handleChange);

    if (music.start) {
      music.start();
    }
    const state = store.getState();
    states.dispatchPoints(0);
    store.dispatch(actions.combo(-1));
    store.dispatch(actions.speedRun(state.get('speedStart')));
    const startLines = state.get('startLines');
    const startMatrix = getStartMatrix(startLines);
    store.dispatch(actions.tempMatrix(startMatrix));
    store.dispatch(actions.tempMatrix2(startMatrix));
    store.dispatch(actions.matrix(startMatrix));
    store.dispatch(actions.resetBag());
    store.dispatch(actions.resetBagOppo());
    store.dispatch(actions.moveBlock(
      { type: store.getState().get('bag').get(0), x: 0, y: -2 }));
    store.dispatch(actions.moveBlock2(
      { type: store.getState().get('bag').get(1), x: 0, y: 2 }));
    store.dispatch(actions.nextBlock(store.getState().get('bag').get(2)));
    store.dispatch(actions.moveBlockOppo(
      { type: store.getState().get('bagOppo').get(0), x: 0, y: -2 }));
    store.dispatch(actions.moveBlockOppo2(
      { type: store.getState().get('bagOppo').get(1), x: 0, y: 2 }));
    store.dispatch(actions.nextBlock(store.getState().get('bag').get(2)));
    store.dispatch(actions.shiftTwice());
    store.dispatch(actions.holdType(blockType.length - 1));
    store.dispatch(actions.canHold(true));
    store.dispatch(actions.resetLockDelay());
    states.auto();
  },

  // 自动下落
  auto: (timeout) => {
    const out = (timeout < 0 ? 0 : timeout);
    let state = store.getState();
    let cur = state.get('cur');
    let cur2 = state.get('cur2');
    const fall = () => {
      state = store.getState();
      cur = state.get('cur');
      cur2 = state.get('cur2');
      // const myplayerid = state.get('myplayerid');
      const next = cur.fall();
      const next2 = cur2.fall();
      let s1 = false;
      let s2 = false;
      if (want(next, state.get('tempMatrix'))) {
        store.dispatch(actions.resetLockDelay());
        s1 = true;
      }
      if (want(next2, state.get('tempMatrix'))) {
        store.dispatch(actions.resetLockDelay());
        s2 = true;
      }
      console.log(s1);
      console.log(s2);
      let matrix = state.get('matrix');
      if (!s1 && s2) {
        const shape = cur && cur.shape;
        const xy = cur && cur.xy;
        const color = getColor(cur.type);
        shape.forEach((m) => {
          if (xy.get(0) + m.get(1) >= 0) { // 竖坐标可以为负
            let line = matrix.get(xy.get(0) + m.get(1));
            line = line.set(xy.get(1) + m.get(0), color);
            matrix = matrix.set(xy.get(0) + m.get(1), line);
          }
        });
        if (!want(next2, matrix)) {
          const shape2 = cur2 && cur2.shape;
          const xy2 = cur2 && cur2.xy;
          const color2 = getColor(cur2.type);
          shape2.forEach((m) => {
            if (xy2.get(0) + m.get(1) >= 0) { // 竖坐标可以为负
              let line = matrix.get(xy2.get(0) + m.get(1));
              line = line.set(xy2.get(1) + m.get(0), color2);
              matrix = matrix.set(xy2.get(0) + m.get(1), line);
            }
          });
          states.nextAround2(matrix, null, 0);
        } else {
          store.dispatch(actions.moveBlock2(next2));
          states.nextAround(matrix, null, 0); // NOTE: might have bugs
        }
      } else if (s1 && !s2) {
        const shape2 = cur2 && cur2.shape;
        const xy2 = cur2 && cur2.xy;
        const color2 = getColor(cur2.type);
        shape2.forEach((m) => {
          if (xy2.get(0) + m.get(1) >= 0) { // 竖坐标可以为负
            let line = matrix.get(xy2.get(0) + m.get(1));
            line = line.set(xy2.get(1) + m.get(0), color2);
            matrix = matrix.set(xy2.get(0) + m.get(1), line);
          }
        });
        if (!want(next, matrix)) {
          const shape = cur && cur.shape;
          const xy = cur && cur.xy;
          const color = getColor(cur.type);
          shape.forEach((m) => {
            if (xy.get(0) + m.get(1) >= 0) { // 竖坐标可以为负
              let line = matrix.get(xy.get(0) + m.get(1));
              line = line.set(xy.get(1) + m.get(0), color);
              matrix = matrix.set(xy.get(0) + m.get(1), line);
            }
          });
          states.nextAround2(matrix, null, 0);
        } else {
          store.dispatch(actions.moveBlock(next));
          states.nextAround(matrix, null, 1); // NOTE: might have bugs
        }
      } else if (!s1 && !s2) {
        const shape = cur && cur.shape;
        const shape2 = cur2 && cur2.shape;
        const xy = cur && cur.xy;
        const xy2 = cur2 && cur2.xy;
        const color = getColor(cur.type);
        const color2 = getColor(cur2.type);
        shape.forEach((m) => {
          if (xy.get(0) + m.get(1) >= 0) { // 竖坐标可以为负
            let line = matrix.get(xy.get(0) + m.get(1));
            line = line.set(xy.get(1) + m.get(0), color);
            matrix = matrix.set(xy.get(0) + m.get(1), line);
          }
        });
        shape2.forEach((m) => {
          if (xy2.get(0) + m.get(1) >= 0) { // 竖坐标可以为负
            let line = matrix.get(xy2.get(0) + m.get(1));
            line = line.set(xy2.get(1) + m.get(0), color2);
            matrix = matrix.set(xy2.get(0) + m.get(1), line);
          }
        });
        states.nextAround2(matrix, null, 0);
      } else {
        store.dispatch(actions.moveBlock(next));
        store.dispatch(actions.moveBlock2(next2));
        if (state.get('lockDelay').startTime !== null) {
          store.dispatch(actions.updateLockDelay());
        } else {
          store.dispatch(actions.startLockDelay());
        }
        if (store.getState().get('lockDelay').shouldLock) {
          matrix = state.get('matrix');
          const shape = cur && cur.shape;
          const shape2 = cur2 && cur2.shape;
          const xy = cur && cur.xy;
          const xy2 = cur2 && cur2.xy;
          const color = getColor(cur.type);
          const color2 = getColor(cur2.type);
          shape.forEach((m) => {
            if (xy[0] + m.get(1) >= 0) { // 竖坐标可以为负
              let line = matrix.get(xy[0] + m.get(1));
              line = line.set(xy[1] + m.get(0), color);
              matrix = matrix.set(xy[0] + m.get(1), line);
            }
          });
          shape2.forEach((m) => {
            if (xy2[0] + m.get(1) >= 0) { // 竖坐标可以为负
              let line = matrix.get(xy2[0] + m.get(1));
              line = line.set(xy2[1] + m.get(0), color2);
              matrix = matrix.set(xy2[0] + m.get(1), line);
            }
          });
          states.nextAround2(matrix, null, 0);
        }
        states.fallInterval = setTimeout(fall, speeds[state.get('speedRun') - 1]);
      }
    };
    clearTimeout(states.fallInterval);
    states.fallInterval = setTimeout(fall,
      out === undefined ? speeds[state.get('speedRun') - 1] : out);
  },

  // 一个方块结束, 触发下一个
  // character = {0, 1, 2, 3}
  nextAround: (matrix, stopDownTrigger, character = 0) => {
    clearTimeout(states.fallInterval);
    store.dispatch(actions.lock(true));
    store.dispatch(actions.matrix(matrix));
    if (character === 0 || character === 1) {
      store.dispatch(actions.tempMatrix(matrix));
    } else {
      store.dispatch(actions.tempMatrix2(matrix));
    }
    if (typeof stopDownTrigger === 'function') {
      stopDownTrigger();
    }
    const addPoints = (store.getState().get('points') + 10) +
      ((store.getState().get('speedRun') - 1) * 2); // 速度越快, 得分越高

    states.dispatchPoints(addPoints);

    if (isClear(matrix)) {
      let combo = store.getState().get('combo');
      combo += 1;
      store.dispatch(actions.combo(combo));
      if (music.clear) {
        music.clear();
      }
      return;
    }
    store.dispatch(actions.combo(-1));
    if (isOver(matrix)) {
      if (music.gameover) {
        music.gameover();
      }
      states.overStart();
    }
    setTimeout(() => {
      store.dispatch(actions.lock(false));
      let option;
      if (character === 0) {
        option = states.getOffset(store.getState().get('next'),
          store.getState().get('cur2'), matrix);
        store.dispatch(actions.moveBlock({
          type: store.getState().get('next'), x: option.x, y: option.y }));
      } else if (character === 1) {
        option = states.getOffset(store.getState().get('next'),
          store.getState().get('cur'), matrix);
        store.dispatch(actions.moveBlock2({
          type: store.getState().get('next'), x: option.x, y: option.y }));
      } else if (character === 2) {
        option = states.getOffset(store.getState().get('next'),
          store.getState().get('cur2'), matrix);
        store.dispatch(actions.moveBlockOppo({
          type: store.getState().get('next'), x: option.x, y: option.y }));
      } else if (character === 3) {
        option = states.getOffset(store.getState().get('next'),
          store.getState().get('cur'), matrix);
        store.dispatch(actions.moveBlockOppo2({
          type: store.getState().get('next'), x: option.x, y: option.y }));
      }
      store.dispatch(actions.nextBlock(store.getState().get('bag').get(0)));
      store.dispatch(actions.shiftNextBlock());
      store.dispatch(actions.canHold(true));
      store.dispatch(actions.resetLockDelay());
      addPenalty(0);
      states.auto();
    }, 100);
  },

  nextAround2: (matrix, stopDownTrigger, character = 0) => {
    clearTimeout(states.fallInterval);
    store.dispatch(actions.lock(true));
    store.dispatch(actions.matrix(matrix));
    if (character === 0 || character === 1) {
      store.dispatch(actions.tempMatrix(matrix));
    } else {
      store.dispatch(actions.tempMatrix2(matrix));
    }
    if (typeof stopDownTrigger === 'function') {
      stopDownTrigger();
    }
    const addPoints = (store.getState().get('points') + 10) +
      ((store.getState().get('speedRun') - 1) * 2); // 速度越快, 得分越高

    states.dispatchPoints(addPoints);

    if (isClear(matrix)) {
      let combo = store.getState().get('combo');
      combo += 1;
      store.dispatch(actions.combo(combo));
      if (music.clear) {
        music.clear();
      }
      return;
    }
    store.dispatch(actions.combo(-1));
    if (isOver(matrix)) {
      if (music.gameover) {
        music.gameover();
      }
      states.overStart();
    }
    setTimeout(() => {
      store.dispatch(actions.lock(false));
      if (character === 0) {
        store.dispatch(actions.moveBlock(
          { type: store.getState().get('bag').get(0), x: 0, y: -2 }));
        store.dispatch(actions.moveBlock2(
          { type: store.getState().get('bag').get(1), x: 0, y: 2 }));
        store.dispatch(actions.nextBlock(store.getState().get('bag').get(2)));
        store.dispatch(actions.shiftTwice());
      } else {
        store.dispatch(actions.moveBlock(
          { type: store.getState().get('bag').get(0), x: 0, y: -2 }));
        store.dispatch(actions.moveBlock2(
          { type: store.getState().get('bag').get(1), x: 0, y: 2 }));
        store.dispatch(actions.nextBlock(store.getState().get('bag').get(2)));
        store.dispatch(actions.shiftTwice());
      }
      store.dispatch(actions.canHold(true));
      store.dispatch(actions.resetLockDelay());
      addPenalty(0);
      states.auto();
    }, 100);
  },

  // 页面焦点变换
  focus: (isFocus) => {
    store.dispatch(actions.focus(isFocus));
    if (!isFocus) {
      clearTimeout(states.fallInterval);
      return;
    }
    const state = store.getState();
    if (state.get('cur') && state.get('cur2') && !state.get('reset') && !state.get('pause')) {
      states.auto();
    }
  },

  // 暂停
  pause: (isPause) => {
    store.dispatch(actions.pause(isPause));
    if (isPause) {
      clearTimeout(states.fallInterval);
      return;
    }
    states.auto();
  },

  // 消除行
  clearLines: (matrix, lines) => {
    const state = store.getState();
    let newMatrix = matrix;
    lines.forEach(n => {
      newMatrix = newMatrix.splice(n, 1);
      newMatrix = newMatrix.unshift(List(blankLine));
    });
    store.dispatch(actions.matrix(newMatrix));
    store.dispatch(actions.tempMatrix(newMatrix));
    store.dispatch(actions.tempMatrix2(newMatrix));
    // addPenalty(lines.length);
    store.dispatch(actions.moveBlock({ type: state.get('next') }));
    store.dispatch(actions.nextBlock(state.get('bag').get(0)));
    store.dispatch(actions.shiftNextBlock());
    store.dispatch(actions.canHold(true));
    states.auto();
    store.dispatch(actions.lock(false));
    const clearLines = state.get('clearLines') + lines.length;
    store.dispatch(actions.clearLines(clearLines)); // 更新消除行

    const addPoints = store.getState().get('points') +
      clearPoints[lines.length - 1]; // 一次消除的行越多, 加分越多
    states.dispatchPoints(addPoints);

    const speedAdd = Math.floor(clearLines / eachLines); // 消除行数, 增加对应速度
    let speedNow = state.get('speedStart') + speedAdd;
    speedNow = speedNow > 6 ? 6 : speedNow;
    store.dispatch(actions.speedRun(speedNow));
  },

  // 游戏结束, 触发动画
  overStart: () => {
    clearTimeout(states.fallInterval);
    store.dispatch(actions.lock(true));
    store.dispatch(actions.reset(true));
    store.dispatch(actions.pause(false));
  },

  // 游戏结束动画完成
  overEnd: () => {
    store.dispatch(actions.tempMatrix(blankMatrix));
    store.dispatch(actions.tempMatrix2(blankMatrix));
    store.dispatch(actions.matrix(blankMatrix));
    store.dispatch(actions.moveBlock({ reset: true }));
    store.dispatch(actions.moveBlock2({ reset: true }));
    store.dispatch(actions.holdType(blockType.length - 1));
    store.dispatch(actions.reset(false));
    store.dispatch(actions.lock(false));
    store.dispatch(actions.clearLines(0));
    store.dispatch(actions.resetBag());
  },

  // 写入分数
  dispatchPoints: (point) => { // 写入分数, 同时判断是否创造最高分
    store.dispatch(actions.points(point));
    if (point > 0 && point > store.getState().get('max')) {
      store.dispatch(actions.max(point));
    }
  },

  getOffset: (next, cur, matrix) => {
    let tMatrix = matrix;
    const tshape = cur && cur.shape;
    const txy = cur && cur.xy;
    tshape.forEach((m) => {
      if (txy.get(0) + m.get(1) >= 0) { // 竖坐标可以为负
        let line = tMatrix.get(txy.get(0) + m.get(1));
        line = line.set(txy.get(1) + m.get(0), 1);
        tMatrix = tMatrix.set(txy.get(0) + m.get(1), line);
      }
    });
    if (cur === undefined || cur === null) return { x: 0, y: 0 };
    let tmp;
    for (let i = 0; i < 5; i++) {
      tmp = new Block({ type: next, x: 0, y: -i });
      tmp.xy = [tmp.xy.get(0), tmp.xy.get(1)];
      if (want(tmp, tMatrix)) return { x: 0, y: -i };
      tmp = new Block({ type: next, x: 0, y: i });
      tmp.xy = [tmp.xy.get(0), tmp.xy.get(1)];
      if (want(tmp, tMatrix)) return { x: 0, y: i };
    }
    return { x: 0, y: 0 };
  },
};

export default states;
