import { combineReducers } from 'redux-immutable';
import pause from './pause';
import music from './music';
import matrix from './matrix';
import matrixOppo from './matrixOppo';
import next from './next';
import cur from './cur';
import curOppo from './curOppo';
import startLines from './startLines';
import max from './max';
import points from './points';
import speedStart from './speedStart';
import speedRun from './speedRun';
import lock from './lock';
import clearLines from './clearLines';
import reset from './reset';
import drop from './drop';
import keyboard from './keyboard';
import focus from './focus';
import holdType from './holdType';
import canHold from './canHold';
import bag from './bag';
import peerConnection from './peerConnection';


const rootReducer = combineReducers({
  pause,
  music,
  matrix,
  next,
  cur,
  curOppo,
  startLines,
  max,
  points,
  speedStart,
  speedRun,
  lock,
  clearLines,
  reset,
  drop,
  keyboard,
  focus,
  holdType,
  canHold,
  bag,
  matrixOppo,
  peerConnection,
});

export default rootReducer;
