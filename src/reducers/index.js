import { combineReducers } from 'redux-immutable';
import pause from './pause';
import music from './music';
import matrix from './matrix';
import matrixOppo from './matrixOppo';
import tempMatrix from './tempMatrix';
import tempMatrix2 from './tempMatrix2';
import next from './next';
import cur from './cur';
import cur2 from './cur2';
import curOppo from './curOppo';
import curOppo2 from './curOppo2';
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
import combo from './combo';
import peerConnection from './peerConnection';
import myplayerid from './myplayerid';
import lockDelay from './lockDelay';
import linesReceived from './linesReceived';

const rootReducer = combineReducers({
    pause,
    music,
    matrix,
    matrixOppo,
    next,
    cur,
    cur2,
    curOppo,
    curOppo2,
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
    combo,
    myplayerid,
    tempMatrix,
    tempMatrix2,
    peerConnection,
    lockDelay,
    linesReceived,
});

export default rootReducer;
