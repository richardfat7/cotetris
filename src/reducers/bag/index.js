import { List } from 'immutable';
import * as reducerType from '../../unit/reducerType';
import { blockType } from '../../unit/const';

const initState = (() => {
    let bigbag = List();
    const len = blockType.length - 1;
    let bag = List();

    for (let i = 0; i < len; i++) {
        bag = bag.push(blockType[i]);
    }

    for (let j = 0; j < 100; j++) {
        bag = bag.sortBy(Math.random);
        for (let i = 0; i < len; i++) {
            bigbag = bigbag.push(bag[i]);
        }
    }

    return bigbag;
})();

const bag = (state = initState, action) => {
    switch (action.type) {
        case reducerType.SHIFT_TWICE: {
            let sbag = state;

            sbag = sbag.shift().shift().shift();
            if (sbag.size < 7) {
                let newBag = List();
                const len = blockType.length - 1;

                for (let i = 0; i < len; i++) {
                    newBag = newBag.push(blockType[i]);
                }

                newBag = newBag.sortBy(Math.random);
                sbag = sbag.concat(newBag);
            }

            return sbag;
        }

        case reducerType.SHIFT_NEXT_BLOCK: {
            let sbag = state;

            sbag = sbag.shift();
            if (sbag.size < 7) {
                let newBag = List();
                const len = blockType.length - 1;

                for (let i = 0; i < len; i++) {
                    newBag = newBag.push(blockType[i]);
                }

                newBag = newBag.sortBy(Math.random);
                sbag = sbag.concat(newBag);
            }

            return sbag;
        }

        case reducerType.RESET_BAG: {
            let sbag = List();
            const len = blockType.length - 1;

            for (let i = 0; i < len; i++) {
                sbag = sbag.push(blockType[i]);
            }

            sbag = sbag.sortBy(Math.random);

            return sbag;
        }

        default:
            return state;
    }
};

export default bag;
