import React from 'react';
import { connect } from 'react-redux';
import classnames from 'classnames';
import propTypes from 'prop-types';

import style from './index.less';

import Matrix from '../../components/matrix';
import Decorate from '../../components/decorate';
import Number from '../../components/number';
import Next from '../../components/next';
import Hold from '../../components/hold';
import Music from '../../components/music';
import Pause from '../../components/pause';
import Point from '../../components/point';
import Logo from '../../components/logo';
import LogoOPPO from '../../components/logoOPPO';
import Keyboard from '../../components/keyboard';
import Guide from '../../components/guide';

import { transform, lastRecord, speeds, i18n, lan } from '../../unit/const';
import { visibilityChangeEvent, isFocus } from '../../unit/';
import states from '../../control/states';

class Tetris extends React.Component {
    constructor() {
        super();
        this.state = {
            w: document.documentElement.clientWidth,
            h: document.documentElement.clientHeight,
        };
    }
    componentWillMount() {
        window.addEventListener('resize', this.resize.bind(this), true);
    }
    componentDidMount() {
        if (visibilityChangeEvent) { // 将页面的焦点变换写入store
            document.addEventListener(visibilityChangeEvent, () => {
                states.focus(isFocus());
            }, false);
        }

        if (lastRecord) { // 读取记录
            if (lastRecord.cur && !lastRecord.pause) { // 拿到上一次游戏的状态, 如果在游戏中且没有暂停, 游戏继续
                const speedRun = this.props.speedRun;
                let timeout = speeds[speedRun - 1] / 2; // 继续时, 给予当前下落速度一半的停留时间

                // 停留时间不小于最快速的速度
                timeout = speedRun < speeds[speeds.length - 1] ? speeds[speeds.length - 1] : speedRun;
                states.auto(timeout);
            }

            if (!lastRecord.cur) {
                states.overStart();
            }
        } else {
            states.overStart();
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

            css[transform] = `scale(${scale}) translateX(-50%)`;

            return css;
        })();

        return (
            <div
                className={style.app}
                style={size}
            >
                <div className={classnames({ [style.rect]: true, [style.drop]: this.props.drop })}>
                    <Decorate />
                    <div className={style.screen}>
                        <div className={style.panel}>
                            <div className={style.state}>
                                <p>{i18n.hold[lan]}</p>
                                <Hold data={this.props.holdType} />
                                <Point cur={!!this.props.cur} point={this.props.points} max={this.props.max} />
                                <p>{ this.props.cur ? i18n.cleans[lan] : '' }</p>
                                <Number number={this.props.cur ? this.props.clearLines : 0} />
                                <p>{i18n.next[lan]}</p>
                                <Next data={this.props.next} />
                                <div className={style.bottom}>
                                    <Music data={this.props.music} />
                                    <Pause data={this.props.pause} />
                                    <Number time />
                                </div>
                            </div>
                            <Matrix
                                matrix={this.props.matrix}
                                cur={this.props.cur}
                                cur2={this.props.cur2}
                                reset={this.props.reset}
                                myplayerid={this.props.myplayerid}
                                lock={this.props.lock}
                            />
                            <Logo cur={!!this.props.cur} reset={this.props.reset} />
                            <Matrix
                                matrix={this.props.matrixOppo}
                                cur={this.props.curOppo}
                                cur2={this.props.curOppo2}
                                reset={this.props.reset}
                                lock={this.props.lock}
                                myplayerid={-1}
                            />
                            <LogoOPPO cur={!!this.props.cur} reset={this.props.reset} />
                            <div className={style.state}>
                                <p>{i18n.hold[lan]}</p>
                                <Hold data={this.props.holdType} />
                                <Point cur={!!this.props.cur} point={this.props.points} max={this.props.max} />
                                <p>{ this.props.cur ? i18n.cleans[lan] : '' }</p>
                                <Number number={this.props.cur ? this.props.clearLines : 0} />
                                <p>{i18n.next[lan]}</p>
                                <Next data={this.props.next} />
                            </div>
                        </div>
                    </div>
                </div>
                <Keyboard filling={filling} keyboard={this.props.keyboard} />
                <Guide />
            </div>
        );
    }
}

Tetris.propTypes = {
    myplayerid: propTypes.number.isRequired,
    music: propTypes.bool.isRequired,
    pause: propTypes.bool.isRequired,
    matrix: propTypes.object.isRequired,
    matrixOppo: propTypes.object.isRequired,
    next: propTypes.string.isRequired,
    cur: propTypes.object,
    cur2: propTypes.object,
    curOppo: propTypes.object,
    curOppo2: propTypes.object,
    holdType: propTypes.string.isRequired,
    dispatch: propTypes.func.isRequired,
    speedStart: propTypes.number.isRequired,
    speedRun: propTypes.number.isRequired,
    startLines: propTypes.number.isRequired,
    clearLines: propTypes.number.isRequired,
    points: propTypes.number.isRequired,
    max: propTypes.number.isRequired,
    reset: propTypes.bool.isRequired,
    drop: propTypes.bool.isRequired,
    keyboard: propTypes.object.isRequired,
    lock: propTypes.bool.isRequired,
};

const mapStateToProps = (state) => ({
    myplayerid: state.get('myplayerid'),
    pause: state.get('pause'),
    music: state.get('music'),
    matrix: state.get('matrix'),
    matrixOppo: state.get('matrixOppo'),
    next: state.get('next'),
    cur: state.get('cur'),
    cur2: state.get('cur2'),
    curOppo: state.get('curOppo'),
    curOppo2: state.get('curOppo2'),
    holdType: state.get('holdType'),
    speedStart: state.get('speedStart'),
    speedRun: state.get('speedRun'),
    startLines: state.get('startLines'),
    clearLines: state.get('clearLines'),
    points: state.get('points'),
    max: state.get('max'),
    reset: state.get('reset'),
    drop: state.get('drop'),
    keyboard: state.get('keyboard'),
    lock: state.get('lock'),
});

// export default connect(mapStateToProps)(App);

export default connect(mapStateToProps)(Tetris);
