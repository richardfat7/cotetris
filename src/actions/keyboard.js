import * as reducerType from '../unit/reducerType';

function drop(data) {
    return {
        type: reducerType.KEY_DROP,
        data,
    };
}

function down(data) {
    return {
        type: reducerType.KEY_DOWN,
        data,
    };
}

function left(data) {
    return {
        type: reducerType.KEY_LEFT,
        data,
    };
}

function right(data) {
    return {
        type: reducerType.KEY_RIGHT,
        data,
    };
}

function rotate(data) {
    return {
        type: reducerType.KEY_ROTATE,
        data,
    };
}

function z(data) {
    return {
        type: reducerType.KEY_Z,
        data,
    };
}

function reset(data) {
    return {
        type: reducerType.KEY_RESET,
        data,
    };
}

function music(data) {
    return {
        type: reducerType.KEY_MUSIC,
        data,
    };
}

function pause(data) {
    return {
        type: reducerType.KEY_PAUSE,
        data,
    };
}

function hold(data) {
    return {
        type: reducerType.KEY_HOLD,
        data,
    };
}

export default {
    drop,
    down,
    left,
    right,
    rotate,
    z,
    reset,
    music,
    pause,
    hold,
};
