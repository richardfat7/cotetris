import React from 'react';
import { connect } from 'react-redux';
import classnames from 'classnames';
import propTypes from 'prop-types';
import style from './room.less';

import Decorate from '../../components/decorate';
import Peer from '../../components/peer';

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

        return (
            <div
                className={style.app}
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
