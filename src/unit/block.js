import { List } from 'immutable';
import { blockShape, offset } from './const';

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
          this.xy = List([0, 4]);
          break;
        case 'L': // L
          this.xy = List([0, 4]);
          break;
        case 'J': // J
          this.xy = List([0, 4]);
          break;
        case 'Z': // Z
          this.xy = List([0, 4]);
          break;
        case 'S': // S
          this.xy = List([0, 4]);
          break;
        case 'O': // O
          this.xy = List([0, 4]);
          break;
        case 'T': // T
          this.xy = List([0, 4]);
          break;
        default:
          break;
      }
    } else {
      this.xy = List(option.xy);
    }
  }
  // clockwise
  // y, -x
  rotate(set = 0) {
    const shape = this.shape;
    let result = List([]);
    shape.forEach(m => {
      result = result.push(List([-m.get(1), m.get(0)]));
    });
    const nextRotateIndex = ((this.rotateIndex + offset[this.type].length) + 1)
     % offset[this.type].length;
    const ric = this.rotateIndex;
    const rin = nextRotateIndex;
    const dyx = [offset[this.type][ric][set][0] - offset[this.type][rin][set][0],
      offset[this.type][ric][set][1] - offset[this.type][rin][set][1]];
    return {
      shape: result,
      type: this.type,
      xy: [this.xy.get(0) + dyx[1], this.xy.get(1) + dyx[0]],
      rotateIndex: nextRotateIndex,
      timeStamp: this.timeStamp,
    };
  }
  // anti-clockwise
  // -y, x
  z(set = 0) {
    const shape = this.shape;
    let result = List([]);
    shape.forEach(m => {
      result = result.push(List([m.get(1), -m.get(0)]));
    });
    const nextRotateIndex = ((this.rotateIndex + offset[this.type].length) - 1)
     % offset[this.type].length;
    const ric = this.rotateIndex;
    const rin = nextRotateIndex;
    const dyx = [offset[this.type][ric][set][0] - offset[this.type][rin][set][0],
      offset[this.type][ric][set][1] - offset[this.type][rin][set][1]];
    return {
      shape: result,
      type: this.type,
      xy: [this.xy.get(0) + dyx[1], this.xy.get(1) + dyx[0]],
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
