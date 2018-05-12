import React from 'react';
import immutable, { List } from 'immutable';
import classnames from 'classnames';
import propTypes from 'prop-types';

import style from './index.less';
import { isClear, want } from '../../unit/';
import { fillLine, blankLine } from '../../unit/const';
import states from '../../control/states';

const t = setTimeout;

export default class MatrixOPPO extends React.Component {
  constructor() {
    super();
    this.state = {
      clearLines: false,
      animateColor: 2,
      isOver: false,
      overState: null,
    };
  }
  componentWillReceiveProps(nextProps = {}) {
    const clears = isClear(nextProps.matrix);
    const overs = nextProps.reset;
    this.setState({
      clearLines: clears,
      isOver: overs,
    });
    if (clears && !this.state.clearLines) {
      this.clearAnimate(clears);
    }
    if (!clears && overs && !this.state.isOver) {
      this.over(nextProps);
    }
  }
  shouldComponentUpdate(nextProps = {}) { // 使用Immutable 比较两个List 是否相等
    const props = this.props;
    return !(
      immutable.is(nextProps.matrix, props.matrix) &&
      immutable.is(
        (nextProps.cur && nextProps.cur.shape),
        (props.cur && props.cur.shape)
      ) &&
      immutable.is(
        (nextProps.cur2 && nextProps.cur2.shape),
        (props.cur2 && props.cur2.shape)
      ) &&
      immutable.is(
        (nextProps.cur && nextProps.cur.xy),
        (props.cur && props.cur.xy)
      ) &&
      immutable.is(
        (nextProps.cur2 && nextProps.cur2.xy),
        (props.cur2 && props.cur2.xy)
      )
    ) || this.state.clearLines
    || this.state.isOver;
  }
  getResult(props = this.props) {
    const cur = props.cur;
    // const cur2 = props.cur2;
    const shape = cur && cur.shape;
    const xy = cur && cur.xy;

    let matrix = props.matrix;

    let ghost;
    if (cur) {
      // calc ghost
      let index = 0;
      ghost = cur.fall(index);
      while (want(ghost, matrix)) {
        ghost = cur.fall(index);
        index++;
      }
      ghost = cur.fall(index - 2);
    }
    const gshape = cur && ghost && ghost.shape;
    const gxy = cur && ghost && List(ghost.xy);

    const clearLines = this.state.clearLines;
    if (clearLines) {
      const animateColor = this.state.animateColor;
      clearLines.forEach((index) => {
        matrix = matrix.set(index, List([
          animateColor,
          animateColor,
          animateColor,
          animateColor,
          animateColor,
          animateColor,
          animateColor,
          animateColor,
          animateColor,
          animateColor,
        ]));
      });
    } else {
      if (cur && gshape) {
        gshape.forEach((m, k1) => (
          m.forEach((n, k2) => {
            if (n && gxy.get(0) + k1 >= 0) { // 竖坐标可以为负
              let line = matrix.get(gxy.get(0) + k1);
              const color = 10;
              line = line.set(gxy.get(1) + k2, color);
              matrix = matrix.set(gxy.get(0) + k1, line);
            }
          })
        ));
      }
      if (shape) {
        shape.forEach((m, k1) => (
          m.forEach((n, k2) => {
            if (n && xy.get(0) + k1 >= 0) { // 竖坐标可以为负
              let line = matrix.get(xy.get(0) + k1);
              let color;
              if (line.get(xy.get(1) + k2) === 1 && !clearLines) { // 矩阵与方块重合
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
                  color = 2;
                }
              } else if (cur.type === 'I') {
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
                color = 2;
              }
              line = line.set(xy.get(1) + k2, color);
              matrix = matrix.set(xy.get(0) + k1, line);
            }
          })
        ));
      }
    }
    return matrix;
  }
  clearAnimate() {
    const anima = (callback) => {
      t(() => {
        this.setState({
          animateColor: 0,
        });
        t(() => {
          this.setState({
            animateColor: 2,
          });
          if (typeof callback === 'function') {
            callback();
          }
        }, 100);
      }, 100);
    };
    anima(() => {
      anima(() => {
        anima(() => {
          t(() => {
            states.clearLines(this.props.matrix, this.state.clearLines);
          }, 100);
        });
      });
    });
  }
  over(nextProps) {
    let overState = this.getResult(nextProps);
    this.setState({
      overState,
    });

    const exLine = (index) => {
      if (index <= 19) {
        overState = overState.set(19 - index, List(fillLine));
      } else if (index >= 20 && index <= 39) {
        overState = overState.set(index - 20, List(blankLine));
      } else {
        states.overEnd();
        return;
      }
      this.setState({
        overState,
      });
    };

    for (let i = 0; i <= 40; i++) {
      t(exLine.bind(null, i), 40 * (i + 1));
    }
  }
  render() {
    let matrix;
    if (this.state.isOver) {
      matrix = this.state.overState;
    } else {
      matrix = this.getResult();
    }
    return (
      <div className={style.matrix}>{
          matrix.map((p, k1) => (<p key={k1}>
            {
              p.map((e, k2) => <b
                className={classnames({
                  c: e === 1,
                  d: e === 2,
                  i: e === 3,
                  o: e === 4,
                  t: e === 5,
                  s: e === 6,
                  z: e === 7,
                  j: e === 8,
                  l: e === 9,
                  g: e === 10,
                })}
                key={k2}
              />)
            }
          </p>))
      }
      </div>
    );
  }
}

MatrixOPPO.propTypes = {
  matrix: propTypes.object.isRequired,
  cur: propTypes.object,
  cur2: propTypes.object,
  reset: propTypes.bool.isRequired,
};
