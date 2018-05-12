import { List } from 'immutable';
import store from '../store';
import { want, isClear, isOver } from '../unit/';
import actions from '../actions';
import { speeds, blankLine, blankMatrix, clearPoints, eachLines, blockType } from '../unit/const';
import { music } from '../unit/music';


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

const states = {
  // 自动下落setTimeout变量
  fallInterval: null,

  // 游戏开始
  start: () => {
    if (music.start) {
      music.start();
    }
    const state = store.getState();
    states.dispatchPoints(0);
    store.dispatch(actions.speedRun(state.get('speedStart')));
    const startLines = state.get('startLines');
    const startMatrix = getStartMatrix(startLines);
    store.dispatch(actions.matrix(startMatrix));
    store.dispatch(actions.resetBag());
    store.dispatch(actions.moveBlock({ type: store.getState().get('bag').first() }));
    store.dispatch(actions.shiftNextBlock());
    store.dispatch(actions.nextBlock(store.getState().get('bag').first()));
    store.dispatch(actions.moveBlock2({ type: store.getState().get('bag').get(2) }));
    store.dispatch(actions.shiftNextBlock());
    store.dispatch(actions.nextBlock(store.getState().get('bag').first()));
    store.dispatch(actions.holdType(blockType.length - 1));
    store.dispatch(actions.canHold(true));
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
      const next = cur.fall();
      const next2 = cur2.fall();
      let matrix;
      // let s1 = false; let s2 = false;
      if (want(next, state.get('matrix'))) {
        store.dispatch(actions.moveBlock(next));
        states.fallInterval = setTimeout(fall, speeds[state.get('speedRun') - 1]);
        // s1 = true;
        // console.log(s1);
      } else {
        matrix = state.get('matrix');
        const shape = cur && cur.shape;
        const xy = cur && cur.xy;
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
        // states.nextAround(matrix);
      }
      if (want(next2, state.get('matrix'))) {
        store.dispatch(actions.moveBlock2(next2));
        // s2 = true;
        // console.log(s2);
        // states.fallInterval = setTimeout(fall, speeds[state.get('speedRun') - 1]);
      } else {
        matrix = state.get('matrix');
        const shape = cur2 && cur2.shape;
        const xy = cur2 && cur2.xy;
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
        shape.forEach((m, k1) => (
          m.forEach((n, k2) => {
            if (n && xy.get(0) + k1 >= 0) { // 竖坐标可以为负
              let line = matrix.get(xy.get(0) + k1);
              line = line.set(xy.get(1) + k2, color);
              matrix = matrix.set(xy.get(0) + k1, line);
            }
          })
        ));
        states.nextAround(matrix);
      }
    };
    clearTimeout(states.fallInterval);
    states.fallInterval = setTimeout(fall,
      out === undefined ? speeds[state.get('speedRun') - 1] : out);
  },

  // 一个方块结束, 触发下一个
  nextAround: (matrix, stopDownTrigger) => {
    clearTimeout(states.fallInterval);
    store.dispatch(actions.lock(true));
    store.dispatch(actions.matrix(matrix));
    if (typeof stopDownTrigger === 'function') {
      stopDownTrigger();
    }

    const addPoints = (store.getState().get('points') + 10) +
      ((store.getState().get('speedRun') - 1) * 2); // 速度越快, 得分越高

    states.dispatchPoints(addPoints);

    if (isClear(matrix)) {
      if (music.clear) {
        music.clear();
      }
      return;
    }
    if (isOver(matrix)) {
      if (music.gameover) {
        music.gameover();
      }
      states.overStart();
      return;
    }
    setTimeout(() => {
      store.dispatch(actions.lock(false));
      store.dispatch(actions.moveBlock({ type: store.getState().get('next') }));
      store.dispatch(actions.nextBlock(store.getState().get('bag').first()));
      store.dispatch(actions.shiftNextBlock());
      store.dispatch(actions.canHold(true));
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
    store.dispatch(actions.moveBlock({ type: state.get('next') }));
    store.dispatch(actions.nextBlock(state.get('bag').first()));
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
    store.dispatch(actions.matrix(blankMatrix));
    store.dispatch(actions.moveBlock({ reset: true }));
    store.dispatch(actions.holdType(blockType.length - 1));
    store.dispatch(actions.reset(false));
    store.dispatch(actions.lock(false));
    store.dispatch(actions.clearLines(0));
  },

  // 写入分数
  dispatchPoints: (point) => { // 写入分数, 同时判断是否创造最高分
    store.dispatch(actions.points(point));
    if (point > 0 && point > store.getState().get('max')) {
      store.dispatch(actions.max(point));
    }
  },
};

export default states;
