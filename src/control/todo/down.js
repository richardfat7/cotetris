import { want, senddata } from '../../unit/';
import event from '../../unit/event';
import actions from '../../actions';
import states from '../states';
import { music } from '../../unit/music';
import * as reducerType from '../../unit/reducerType';

const down = (store, id = null) => {
    const peerState = store.getState().get('peerConnection');
    const myplayerid = id === null ? store.getState().get('myplayerid') : id;

    if (myplayerid % 2 === 1 && id === null) {
        senddata(peerState.conns, { label: 'syncmove', key: 'down', id: myplayerid });
    } else {
        store.dispatch(actions.keyboard.down(true));

        let curV;
        let curV2;
        let tmpMatrix;
        let type;
        let type2;

        if (myplayerid === 0) {
            curV = 'cur';
            curV2 = 'cur2';
            tmpMatrix = 'tempMatrix';
            type = reducerType.MOVE_BLOCK;
            type2 = reducerType.MOVE_BLOCK2;
        } else if (myplayerid === 1) {
            curV = 'cur2';
            curV2 = 'cur';
            tmpMatrix = 'tempMatrix';
            type = reducerType.MOVE_BLOCK2;
            type2 = reducerType.MOVE_BLOCK;
        } else if (myplayerid === 2) {
            curV = 'cur';
            curV2 = 'cur2';
            tmpMatrix = 'tempMatrix';
            type = reducerType.MOVE_BLOCK;
            type2 = reducerType.MOVE_BLOCK2;
        } else if (myplayerid === 3) {
            curV = 'cur2';
            curV2 = 'cur';
            tmpMatrix = 'tempMatrix';
            type = reducerType.MOVE_BLOCK2;
            type2 = reducerType.MOVE_BLOCK;
        }

        if (store.getState().get(curV) !== null) {
            event.down({
                key: 'down',
                begin: 40,
                interval: 40,
                callback: (stopDownTrigger) => {
                    const state = store.getState();

                    if (state.get('lock')) {
                        return;
                    }

                    if (music.move) {
                        music.move();
                    }

                    const cur = state.get(curV);
                    const cur2 = state.get(curV2);

                    if (cur === null) {
                        return;
                    }

                    if (state.get('pause')) {
                        states.pause(false);

                        return;
                    }

                    const next = cur.fall();

                    if (want(next, state.get('matrix'))) {
                        let tMatrix = state.get(tmpMatrix);
                        const tshape = cur2 && cur2.shape;
                        const txy = cur2 && cur2.xy;

                        tshape.forEach((m) => {
                            if (txy.get(0) + m.get(1) >= 0) { // 竖坐标可以为负
                                let line = tMatrix.get(txy.get(0) + m.get(1));

                                line = line.set(txy.get(1) + m.get(0), 1);
                                tMatrix = tMatrix.set(txy.get(0) + m.get(1), line);
                            }
                        });
                        if (want(next, tMatrix)) {
                            store.dispatch(actions.moveBlockGeneral(next, type));
                            states.auto();
                        }

                        if (!want(next, tMatrix)) {
                            if (want(cur2.fall(), state.get(tmpMatrix))) {
                                store.dispatch(actions.moveBlockGeneral(cur2.fall(), type2));
                                store.dispatch(actions.moveBlockGeneral(next, type));
                                states.auto();
                            } else {
                                let matrix = state.get('matrix');
                                const shape = cur.shape;
                                const xy = cur.xy;
                                const shape2 = cur2.shape;
                                const xy2 = cur2.xy;
                                let color;

                                if (cur.type === 'I') {
                                    color = 3;
                                } else if (cur.type === 'O') {
                                    color = 4;
                                } else if (cur.type === 'T') {
                                    color = 5;
                                } else if (cur.type === 'S') {
                                    color = 6;
                                } else if (cur.type === 'Z') {
                                    color = 7;
                                } else if (cur.type === 'J') {
                                    color = 8;
                                } else if (cur.type === 'L') {
                                    color = 9;
                                } else {
                                    color = 1;
                                }

                                let color2;

                                if (cur2.type === 'I') {
                                    color2 = 3;
                                } else if (cur2.type === 'O') {
                                    color2 = 4;
                                } else if (cur2.type === 'T') {
                                    color2 = 5;
                                } else if (cur2.type === 'S') {
                                    color2 = 6;
                                } else if (cur2.type === 'Z') {
                                    color2 = 7;
                                } else if (cur2.type === 'J') {
                                    color2 = 8;
                                } else if (cur2.type === 'L') {
                                    color2 = 9;
                                } else {
                                    color2 = 1;
                                }

                                shape.forEach((m) => {
                                    if (xy.get(0) + m.get(1) >= 0) { // 竖坐标可以为负
                                        let line = matrix.get(xy.get(0) + m.get(1));

                                        line = line.set(xy.get(1) + m.get(0), color);
                                        matrix = matrix.set(xy.get(0) + m.get(1), line);
                                    }
                                });
                                shape2.forEach((m) => {
                                    if (xy2.get(0) + m.get(1) >= 0) { // 竖坐标可以为负
                                        let line = matrix.get(xy2.get(0) + m.get(1));

                                        line = line.set(xy2.get(1) + m.get(0), color2);
                                        matrix = matrix.set(xy2.get(0) + m.get(1), line);
                                    }
                                });
                                if (myplayerid === 0) {
                                    states.nextAround(matrix, stopDownTrigger, myplayerid);
                                } else if (myplayerid === 1) {
                                    states.nextAround(matrix, stopDownTrigger, myplayerid);
                                } else if (myplayerid === 2) {
                                    states.nextAround(matrix, stopDownTrigger, myplayerid);
                                } else if (myplayerid === 3) {
                                    states.nextAround(matrix, stopDownTrigger, myplayerid);
                                }

                                store.dispatch(actions.resetLockDelay());
                            }
                        }
                    } else {
                        if (state.get('lockDelay').startTime !== null) {
                            store.dispatch(actions.updateLockDelay());
                        } else {
                            store.dispatch(actions.startLockDelay());
                        }

                        if (store.getState().get('lockDelay').shouldLock) {
                            let matrix = state.get('matrix');
                            const shape = cur.shape;
                            const xy = cur.xy;
                            let color;

                            if (cur.type === 'I') {
                                color = 3;
                            } else if (cur.type === 'O') {
                                color = 4;
                            } else if (cur.type === 'T') {
                                color = 5;
                            } else if (cur.type === 'S') {
                                color = 6;
                            } else if (cur.type === 'Z') {
                                color = 7;
                            } else if (cur.type === 'J') {
                                color = 8;
                            } else if (cur.type === 'L') {
                                color = 9;
                            } else {
                                color = 1;
                            }

                            shape.forEach((m) => {
                                if (xy.get(0) + m.get(1) >= 0) { // 竖坐标可以为负
                                    let line = matrix.get(xy.get(0) + m.get(1));

                                    line = line.set(xy.get(1) + m.get(0), color);
                                    matrix = matrix.set(xy.get(0) + m.get(1), line);
                                }
                            });
                        }
                    }
                },
            });
        } else {
            event.down({
                key: 'down',
                begin: 200,
                interval: 100,
                callback: () => {
                    if (store.getState().get('lock')) {
                        return;
                    }

                    const state = store.getState();
                    const cur = state.get(curV);

                    if (cur) {
                        return;
                    }

                    if (music.move) {
                        music.move();
                    }

                    let startLines = state.get('startLines');

                    startLines = startLines - 1 < 0 ? 10 : startLines - 1;
                    store.dispatch(actions.startLines(startLines));
                },
            });
        }
    }
};

const up = (store) => {
    store.dispatch(actions.keyboard.down(false));
    event.up({
        key: 'down',
    });
};


export default {
    down,
    up,
};
