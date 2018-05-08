import { combineReducers } from 'redux-immutable';
import drop from './drop';
import down from './down';
import left from './left';
import right from './right';
import rotate from './rotate';
import z from './z';
import reset from './reset';
import music from './music';
import pause from './pause';

const keyboardReducer = combineReducers({
  drop,
  down,
  left,
  right,
  rotate,
  z,
  reset,
  music,
  pause,
});

export default keyboardReducer;
