import * as reducerType from '../../unit/reducerType';

const initState = {
    startTime: null,
    lastTime: null,
    shouldLock: false,
};

const parse = (state = initState, action) => {
    switch (action.type) {
        case reducerType.LOCK_DELAY_START: {
            const t = Date.now();

            return {
                startTime: t,
                lastTime: t,
                shouldLock: false,
            };
        }

        case reducerType.LOCK_DELAY_RESET:
            return initState;
        case reducerType.LOCK_DELAY_UPDATE: {
            const t2 = Date.now();

            return {
                startTime: state.startTime,
                lastTime: t2,
                shouldLock: state.startTime !== null ? (t2 - state.startTime > 500) : false,
            };
        }

        default:
            return state;
    }
};

export default parse;
