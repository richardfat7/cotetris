import { List } from 'immutable';
import i18n from '../../i18n.json';

// [x, y]
const blockShape = {
  I: [[0, 0], [-1, 0], [1, 0], [2, 0]],
  L: [[0, 0], [-1, 0], [1, 0], [1, -1]],
  J: [[0, 0], [-1, 0], [1, 0], [-1, -1]],
  Z: [[0, 0], [-1, -1], [1, 0], [0, -1]],
  S: [[0, 0], [-1, 0], [0, -1], [1, -1]],
  O: [[0, 0], [0, -1], [1, 0], [1, -1]],
  T: [[0, 0], [-1, 0], [1, 0], [0, -1]],
  E: [[0, 0, 0, 0], [0, 0, 0, 0]],
};

const offset = {
  I: [[[0, 0], [-1, 0], [2, 0], [-1, 0], [2, 0]],
      [[-1, 0], [0, 0], [0, 0], [0, -1], [0, 2]],
      [[-1, -1], [1, -1], [-2, -1], [1, 0], [-2, 0]],
      [[0, -1], [0, -1], [0, -1], [0, 1], [0, -2]]],
  L: [[[0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
      [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
      [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
      [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]]],
  J: [[[0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
      [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
      [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
      [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]]],
  Z: [[[0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
      [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
      [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
      [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]]],
  S: [[[0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
      [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
      [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
      [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]]],
  O: [[[0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
      [[0, 1], [0, 0], [0, 0], [0, 0], [0, 0]],
      [[-1, 1], [0, 0], [0, 0], [0, 0], [0, 0]],
      [[-1, 0], [0, 0], [0, 0], [0, 0], [0, 0]]],
  T: [[[0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
      [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
      [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
      [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]]],
};

const xyInPreview = { // 方块在下一个中的坐标
  I: [1, 1],
  L: [1, 1],
  J: [1, 1],
  Z: [1, 1],
  S: [1, 1],
  O: [1, 1],
  T: [1, 1],
  E: [0, 0],
};

const empty = [
  [0, 0, 0, 0],
  [0, 0, 0, 0],
];

const blockType = Object.keys(blockShape);

const speeds = [800, 650, 500, 370, 250, 160];

const delays = [50, 60, 70, 80, 90, 100];

const bottomLine = [2, 2, 2, 2, 2, 2, 2, 2, 2, 2];

const fillLine = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1];

const blankLine = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

const blankMatrix = (() => {
  const matrix = [];
  for (let i = 0; i < 20; i++) {
    matrix.push(List(blankLine));
  }
  return List(matrix);
})();

const clearPoints = [100, 300, 700, 1500];

const StorageKey = 'REACT_TETRIS';

const lastRecord = (() => { // 上一把的状态
  let data = localStorage.getItem(StorageKey);
  if (!data) {
    return false;
  }
  try {
    if (window.btoa) {
      data = atob(data);
    }
    data = decodeURIComponent(data);
    data = JSON.parse(data);
  } catch (e) {
    if (window.console || window.console.error) {
      window.console.error('读取记录错误:', e);
    }
    return false;
  }
  // return data;
  return false;
})();

const StorageHold = 'HOLD_TILE';

const lastTile = (() => { // 上一把的状态
  let data = localStorage.getItem(StorageHold);
  if (!data) {
    return false;
  }
  try {
    if (window.btoa) {
      data = atob(data);
    }
    data = decodeURIComponent(data);
    data = JSON.parse(data);
  } catch (e) {
    if (window.console || window.console.error) {
      window.console.error('读取记录错误:', e);
    }
    return false;
  }
  return data;
})();

const maxPoint = 999999;

const transform = (function () {
  const trans = ['transform', 'webkitTransform', 'msTransform', 'mozTransform', 'oTransform'];
  const body = document.body;
  return trans.filter((e) => body.style[e] !== undefined)[0];
}());

const eachLines = 20; // 每消除eachLines行, 增加速度

const getParam = (param) => { // 获取浏览器参数
  const r = new RegExp(`\\?(?:.+&)?${param}=(.*?)(?:&.*)?$`);
  const m = window.location.toString().match(r);
  return m ? decodeURI(m[1]) : '';
};

const lan = (() => {
  let l = getParam('lan').toLowerCase();
  l = i18n.lan.indexOf(l) === -1 ? i18n.default : l;
  return l;
})();

document.title = i18n.data.title[lan];

module.exports = {
  blockShape,
  offset,
  blockType,
  xyInPreview,
  empty,
  speeds,
  delays,
  fillLine,
  blankLine,
  bottomLine,
  blankMatrix,
  clearPoints,
  StorageKey,
  lastRecord,
  StorageHold,
  lastTile,
  maxPoint,
  eachLines,
  transform,
  lan,
  i18n: i18n.data,
};
