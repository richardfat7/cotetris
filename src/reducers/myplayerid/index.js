import * as reducerType from '../../unit/reducerType';

const initState = 0;

const myplayerid = (state = initState, action) => {
    switch (action.type) {
        case reducerType.MYPLAYERID:
            return action.data; // 最大分数
        default:
            return state;
    }
};

export default myplayerid;
