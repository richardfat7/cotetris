import { List } from 'immutable';
import { blockShape, origin } from './const';

class Block {
  constructor(option) {
    this.type = option.type;

    if (!option.rotateIndex) {
      this.rotateIndex = 0;
    } else {
      this.rotateIndex = option.rotateIndex;
    }

    if (!option.timeStamp) {
      this.timeStamp = Date.now();
    } else {
      this.timeStamp = option.timeStamp;
    }

    if (!option.shape) { // init
      this.shape = List(blockShape[option.type].map(e => List(e)));
    } else {
      this.shape = option.shape;
    }
    if (!option.xy) {
      switch (option.type) {
        case 'I': // I
          this.xy = List([0, 3]);
          break;
        case 'L': // L
          this.xy = List([-1, 4]);
          break;
        case 'J': // J
          this.xy = List([-1, 4]);
          break;
        case 'Z': // Z
          this.xy = List([-1, 4]);
          break;
        case 'S': // S
          this.xy = List([-1, 4]);
          break;
        case 'O': // O
          this.xy = List([-1, 4]);
          break;
        case 'T': // T
          this.xy = List([-1, 4]);
          break;
        default:
          break;
      }
    } else {
      this.xy = List(option.xy);
    }
  }
  rotate() {
    const shape = this.shape;
    const len = origin[this.type].length;
    let result = List([]);
    shape.forEach(m => m.forEach((n, k) => {
      const index = m.size - k - 1;
      if (result.get(index) === undefined) {
        result = result.set(index, List([]));
      }
      const tempK = result.get(index).push(n);
      result = result.set(index, tempK);
    }));
    let result1 = List([]);
    result.forEach(m => m.forEach((n, k) => {
      const index1 = m.size - k - 1;
      if (result1.get(index1) === undefined) {
        result1 = result1.set(index1, List([]));
      }
      const tempK1 = result1.get(index1).push(n);
      result1 = result1.set(index1, tempK1);
    }));
    let result2 = List([]);
    result1.forEach(m => m.forEach((n, k) => {
      const index2 = m.size - k - 1;
      if (result2.get(index2) === undefined) {
        result2 = result2.set(index2, List([]));
      }
      const tempK2 = result2.get(index2).push(n);
      result2 = result2.set(index2, tempK2);
    }));
    const nextXy = [
      this.xy.get(0) + origin[this.type][this.rotateIndex][0]
      + origin[this.type][(this.rotateIndex + 1) % len][0]
      + origin[this.type][(this.rotateIndex + 2) % len][0],
      this.xy.get(1) + origin[this.type][this.rotateIndex][1]
      + origin[this.type][(this.rotateIndex + 1) % len][1]
      + origin[this.type][(this.rotateIndex + 2) % len][1],
    ];
    const nextRotateIndex = this.rotateIndex - 1 < 0 ?
      len - 1 : this.rotateIndex - 1;
    return {
      shape: result2,
      type: this.type,
      xy: nextXy,
      rotateIndex: nextRotateIndex,
      timeStamp: this.timeStamp,
    };
  }
  z() {
    const shape = this.shape;
    let result = List([]);
    shape.forEach(m => m.forEach((n, k) => {
      const index = m.size - k - 1;
      if (result.get(index) === undefined) {
        result = result.set(index, List([]));
      }
      const tempK = result.get(index).push(n);
      result = result.set(index, tempK);
    }));
    const nextXy = [
      this.xy.get(0) + origin[this.type][this.rotateIndex][0],
      this.xy.get(1) + origin[this.type][this.rotateIndex][1],
    ];
    const nextRotateIndex = ((this.rotateIndex + origin[this.type].length) + 1)
     % origin[this.type].length;
    return {
      shape: result,
      type: this.type,
      xy: nextXy,
      rotateIndex: nextRotateIndex,
      timeStamp: this.timeStamp,
    };
  }
  fall(n = 1) {
    return {
      shape: this.shape,
      type: this.type,
      xy: [this.xy.get(0) + n, this.xy.get(1)],
      rotateIndex: this.rotateIndex,
      timeStamp: Date.now(),
    };
  }
  right() {
    return {
      shape: this.shape,
      type: this.type,
      xy: [this.xy.get(0), this.xy.get(1) + 1],
      rotateIndex: this.rotateIndex,
      timeStamp: this.timeStamp,
    };
  }
  left() {
    return {
      shape: this.shape,
      type: this.type,
      xy: [this.xy.get(0), this.xy.get(1) - 1],
      rotateIndex: this.rotateIndex,
      timeStamp: this.timeStamp,
    };
  }
}

export default Block;
