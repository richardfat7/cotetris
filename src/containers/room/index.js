import React from 'react';
import { connect } from 'react-redux';
import classnames from 'classnames';
import propTypes from 'prop-types';
import style from './room.less';

import Decorate from '../../components/decorate';
import Peer from '../../components/peer';

import { transform } from '../../unit/const';
import { visibilityChangeEvent, isFocus } from '../../unit/';
import states from '../../control/states';

class Room extends React.Component {
    constructor() {
        super();
        this.state = {
            w: document.documentElement.clientWidth,
            h: document.documentElement.clientHeight,
        };
    }
    componentWillMount() {
        window.addEventListener('resize', this.resize.bind(this), true);
        if (this.props.nth) {
            this.setState({ a: 1 });
        }
    }
    componentDidMount() {
        if (visibilityChangeEvent) { // 将页面的焦点变换写入store
            document.addEventListener(visibilityChangeEvent, () => {
                states.focus(isFocus());
            }, false);
        }
    }
    resize() {
        this.setState({
            w: document.documentElement.clientWidth,
            h: document.documentElement.clientHeight,
        });
    }

    render() {
        let filling = 0;
        const size = (() => {
            const w = this.state.w;
            const h = this.state.h;
            const ratio = h / w;
            let scale;
            let css = {};

            if (ratio < 0.93) {
                scale = h / 960;
            } else {
                scale = w / 1040;
                filling = (h - (960 * scale)) / scale / 3;
                css = {
                    paddingTop: Math.floor(filling) + 42,
                    paddingBottom: Math.floor(filling),
                    marginTop: Math.floor(-480 - (filling * 1.5)),
                };
            }

            css[transform] = `scale(${scale}) translate(-50%, 32px)`;

            return css;
        })();

        return (
            <div
                className={style.app}
                style={size}
            >
                <div className={classnames({ [style.rect]: true })}>
                    <Decorate />
                    <Peer history={this.props.history} />
                </div>
            </div>
        );
    }
}

Room.propTypes = {
    history: propTypes.object,
    nth: propTypes.bool,
};

const mapStateToProps = (state) => ({
    nth: state.get('pause'),
});

export default connect(mapStateToProps)(Room);
