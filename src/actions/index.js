import { getNextType } from '../unit';
import * as reducerType from '../unit/reducerType';
import Block from '../unit/block';
import keyboard from './keyboard';

function nextBlock(data) {
    let next;

    if (data) {
        next = data;
    } else {
        next = null;
    }

    return {
        type: reducerType.NEXT_BLOCK,
        data: next,
    };
}

function moveBlockGeneral(option, type) {
    return {
        type,
        data: option.reset === true ? null : new Block(option),
    };
}

function moveBlock(option) {
    return {
        type: reducerType.MOVE_BLOCK,
        data: option.reset === true ? null : new Block(option),
    };
}

function moveBlock2(option) {
    return {
        type: reducerType.MOVE_BLOCK2,
        data: option.reset === true ? null : new Block(option),
    };
}

function moveBlockOppo(option) {
    return {
        type: reducerType.MOVE_BLOCK_OPPO,
        data: option.reset === true ? null : new Block(option),
    };
}

function moveBlockOppo2(option) {
    return {
        type: reducerType.MOVE_BLOCK_OPPO2,
        data: option.reset === true ? null : new Block(option),
    };
}

function speedStart(n) {
    return {
        type: reducerType.SPEED_START,
        data: n,
    };
}

function speedRun(n) {
    return {
        type: reducerType.SPEED_RUN,
        data: n,
    };
}

function startLines(n) {
    return {
        type: reducerType.START_LINES,
        data: n,
    };
}

function matrix(data) {
    return {
        type: reducerType.MATRIX,
        data,
    };
}

function matrixOppo(data) {
    return {
        type: reducerType.MATRIX_OPPO,
        data,
    };
}

function lock(data) {
    return {
        type: reducerType.LOCK,
        data,
    };
}

function clearLines(data) {
    return {
        type: reducerType.CLEAR_LINES,
        data,
    };
}

function points(data) {
    return {
        type: reducerType.POINTS,
        data,
    };
}

function max(data) {
    return {
        type: reducerType.MAX,
        data,
    };
}

function reset(data) {
    return {
        type: reducerType.RESET,
        data,
    };
}

function drop(data) {
    return {
        type: reducerType.DROP,
        data,
    };
}

function holdType(type) {
    const next = getNextType(type);

    return {
        type: reducerType.HOLD_TYPE,
        data: next,
    };
}

function canHold(data) {
    return {
        type: reducerType.CAN_HOLD,
        data,
    };
}

function pause(data) {
    return {
        type: reducerType.PAUSE,
        data,
    };
}

function music(data) {
    return {
        type: reducerType.MUSIC,
        data,
    };
}

function focus(data) {
    return {
        type: reducerType.FOCUS,
        data,
    };
}

function shiftTwice() {
    return {
        type: reducerType.SHIFT_TWICE,
    };
}

function shiftNextBlock() {
    return {
        type: reducerType.SHIFT_NEXT_BLOCK,
    };
}

function resetBag() {
    return {
        type: reducerType.RESET_BAG,
    };
}

function combo(data) {
    return {
        type: reducerType.COMBO,
        data,
    };
}

function peerSavePeer(data) {
    return {
        type: reducerType.PEER_SAVE_PEER,
        data,
    };
}

function setMyPlayerID(data) {
    return {
        type: reducerType.MYPLAYERID,
        data,
    };
}

function peerSaveConnection(data) {
    return {
        type: reducerType.PEER_SAVE_CONNECTION,
        data,
    };
}

function tempMatrix(data) {
    return {
        type: reducerType.TEMP_MATRIX,
        data,
    };
}

function tempMatrix2(data) {
    return {
        type: reducerType.TEMP_MATRIX2,
        data,
    };
}

function startLockDelay() {
    return {
        type: reducerType.LOCK_DELAY_START,
    };
}

function updateLockDelay() {
    return {
        type: reducerType.LOCK_DELAY_UPDATE,
    };
}

function resetLockDelay() {
    return {
        type: reducerType.LOCK_DELAY_RESET,
    };
}

export default {
    nextBlock,
    moveBlock,
    moveBlock2,
    moveBlockOppo,
    moveBlockOppo2,
    moveBlockGeneral,
    speedStart,
    speedRun,
    startLines,
    matrix,
    matrixOppo,
    lock,
    clearLines,
    points,
    reset,
    max,
    drop,
    holdType,
    canHold,
    pause,
    keyboard,
    music,
    focus,
    shiftTwice,
    shiftNextBlock,
    resetBag,
    combo,
    peerSavePeer,
    peerSaveConnection,
    setMyPlayerID,
    tempMatrix,
    tempMatrix2,
    startLockDelay,
    updateLockDelay,
    resetLockDelay,
};
