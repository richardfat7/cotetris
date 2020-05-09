import React from 'react';
import propTypes from 'prop-types';

import style from './index.less';
import { blockShape, xyInPreview, empty } from '../../unit/const';

export default class Hold extends React.Component {
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
                block[m[1] + xyInPreview[type][0]][m[0] + xyInPreview[type][1]] = 1;
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
                                    <b
                                        className={
                                            ((f, g) => {
                                                if (g) {
                                                    if (f === 'I') {
                                                        return 'i';
                                                    } else if (f === 'O') {
                                                        return 'o';
                                                    } else if (f === 'T') {
                                                        return 't';
                                                    } else if (f === 'S') {
                                                        return 's';
                                                    } else if (f === 'Z') {
                                                        return 'z';
                                                    } else if (f === 'J') {
                                                        return 'j';
                                                    } else if (f === 'L') {
                                                        return 'l';
                                                    }

                                                    return 'c';
                                                }

                                                return '';
                                            })(this.props.data, e)
                                        } key={k2}
                                    />
                                ))
                            }
                        </div>
                    ))
                }
            </div>
        );
    }
}

Hold.propTypes = {
    data: propTypes.string,
};
