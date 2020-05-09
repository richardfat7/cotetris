import React from 'react';
import propTypes from 'prop-types';

import style from './index.less';
import { blockShape } from '../../unit/const';

// const xy = { // 方块在下一个中的坐标
//     I: [1, 0],
//     L: [0, 0],
//     J: [0, 0],
//     Z: [0, 0],
//     S: [0, 0],
//     O: [0, 1],
//     T: [0, 0],
// };

const empty = [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
];

export default class HoldOPPO extends React.Component {
    constructor() {
        super();
        this.state = {
            block: empty,
        };
    }
    componentWillMount() {
        this.build(this.props.data);
    }
    componentWillReceiveProps(nextProps) {
        this.build(nextProps.data);
    }
    shouldComponentUpdate(nextProps) {
        return nextProps.data !== this.props.data;
    }
    build(type) {
        const shape = blockShape[type];
        const block = empty.map(e => ([...e]));

        if (type !== 'E') {
            shape.forEach((m) => {
                // wtf does xyInPreview do?
                // block[m[1] + xyInPreview[type][0]][m[0] + xyInPreview[type][1]] = 1;
            });
        }

        this.setState({ block });
    }
    render() {
        return (
            <div className={style.hold}>
                {
                    this.state.block.map((arr, k1) => (
                        <div key={k1}>
                            {
                                arr.map((e, k2) => (
                                    <b className={e ? 'c' : ''} key={k2} />
                                ))
                            }
                        </div>
                    ))
                }
            </div>
        );
    }
}

HoldOPPO.propTypes = {
    data: propTypes.string,
};
