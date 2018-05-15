import { List } from 'immutable';
import React from 'react';
import propTypes from 'prop-types';
import { Link } from 'react-router-dom';
import Peerjs from 'peerjs';
import store from '../../store';
import states from '../../control/states';
import todo from '../../control/todo';
import actions from '../../actions';
import * as reducerType from '../../unit/reducerType';

export default class Peer extends React.Component {
  constructor() {
    super();
    this.state = {
      config: {
        host: '192.168.0.104',
        port: 9000,
        path: '/',

        // Set highest debug level (log everything!).
        debug: 3,
      },
      configString: '',
      currentplayerid: 0,
      id: '',
      fd: '',
      opp: '',
      conns: [],
      peer: null,
      mypid: 0,
    };
    this.register = this.register.bind(this);
    this.connect = this.connect.bind(this);
    this.connectOpp = this.connectOpp.bind(this);
    this.regClick = this.regClick.bind(this);
    this.connClick = this.connClick.bind(this);
    this.connClickOpp = this.connClickOpp.bind(this);
    this.changeConfig = this.changeConfig.bind(this);
  }
  componentWillMount() {
    this.onChange(this.props);
  }
  componentWillReceiveProps(nextProps) {
    this.onChange(nextProps);
  }
  shouldComponentUpdate({ cur, point, max }) {
    const props = this.props;
    return cur !== props.cur || point !== props.point || max !== props.max || !props.cur;
  }
  onChange(a) {
    return a != null;
  }
  register(id) {
    const peer = new Peerjs(id, this.state.config);
    console.log('Peer', peer);
    store.dispatch(actions.peerSavePeer(peer));
    this.setState({
      id,
      peer,
    }, () => {
      this.state.peer.on('connection', (c) => {
        c.on('open', () => {
          console.log('someone opened connection.');
          this.setState({ conns: [...this.state.conns, c] });
          // payload is player's id
          const lastPlayer = this.state.currentplayerid + 1;
          this.setState({ lastPlayer });
          c.on('data', (res) => {
            const data = JSON.parse(res);
            console.log('RECIEVE data', data);
            if (data.label === 'header') {
              const stateConns = store.getState().get('peerConnection').conns;
              const connsCopy = stateConns.slice();
              connsCopy.push(c);
              const stateConnsT = store.getState().get('peerConnection').connsTarget;
              const connsTCopy = stateConnsT.slice();
              if (data.flag === 'CLI') {
                console.log('someone as client.');
                connsTCopy.push('fd');
              } else if (data.flag === 'OPP') {
                console.log('someone as opp.');
                connsTCopy.push('opp');
              }
              store.dispatch(actions.peerSaveConnection({ conn: connsCopy, target: connsTCopy }));
              if (connsTCopy.length === 2) {
                connsTCopy.forEach((m, k) => {
                  if (m === 'fd') {
                    connsCopy[k].send(JSON.stringify({ label: 'header', flag: 'ACK', payload: 1 }));
                  } else if (m === 'opp') {
                    connsCopy[k].send(JSON.stringify({
                      label: 'header',
                      flag: 'ACK_OPP',
                      payload: 2,
                    }));
                  } else {
                    console.log('ERROR UNEXPECTED VALUE IN CONNS TARGET');
                  }
                });
                if (this.props.history) {
                  this.props.history.push('/tetris');
                }
              }
            } else if (data.label === 'syncmove') {
              todo[data.key].down(store, data.id);
              todo[data.key].up(store);
            } else if (data.label === 'linesSent') {
              if (data.team === 'LEFT') {
                store.dispatch({ type: reducerType.LINES_RECEIVED, data: data.data });
              }
            } else if (data.label === 'syncgame') {
              if (data.team === 'RIGHT') {
                if (data.attr === 'matrix') {
                  // console.log('matrix');
                  let newMatrix = List();
                  data.data.forEach((m) => {
                    newMatrix = newMatrix.push(List(m));
                  });
                  store.dispatch(actions.matrixOppo(newMatrix));
                } else if (data.attr === 'cur2') {
                  // console.log('cur2');
                  if (data.data === null) {
                    const newCur = data.data;
                    let newShape = List();
                    newCur.shape.forEach((m) => {
                      newShape = newShape.push(List(m));
                    });
                    const next = {
                      shape: newShape,
                      type: newCur.type,
                      xy: newCur.xy,
                      rotateIndex: newCur.rotateIndex,
                      timeStamp: newCur.timeStamp,
                    };
                    // console.log(next);
                    store.dispatch(actions.moveBlockOppo2(next));
                  } else {
                    store.dispatch(actions.moveBlockOppo2({ reset: true }));
                  }
                } else if (data.attr === 'cur') {
                  if (data.data === null) {
                    const newCur = data.data;
                    let newShape = List();
                    newCur.shape.forEach((m) => {
                      newShape = newShape.push(List(m));
                    });
                    const next = {
                      shape: newShape,
                      type: newCur.type,
                      xy: newCur.xy,
                      rotateIndex: newCur.rotateIndex,
                      timeStamp: newCur.timeStamp,
                    };
                    // console.log(next);
                    store.dispatch(actions.moveBlockOppo(next));
                  } else {
                    store.dispatch(actions.moveBlockOppo({ reset: true }));
                  }
                }
                store.getState().get('peerConnection').connsTarget.forEach((m, k) => {
                  if (m === 'fd') {
                    store.getState().get('peerConnection').conns[k].send(res);
                  }
                });
              }
            }
          });
          c.on('close', () => {
            c.close();
            console.log(`${c.peer} has left the chat.`);
          });
        });
      });
    });
  }

  connect(id) {
    this.setState({
      fd: id,
    });
    const con = this.state.peer.connect(id, {
      label: 'chat',
      serialization: 'none',
      metadata: {
        message: 'hi i want to chat with you!',
      },
    });
    const stateConns = store.getState().get('peerConnection').conns;
    const connsCopy = stateConns.slice();
    connsCopy.push(con);
    store.dispatch(actions.peerSaveConnection({ conn: connsCopy, target: ['fd'] }));
    this.setState({ conns: [...this.state.conns, con] });
    con.on('open', () => {
      console.log('connection opened.');
      con.send(JSON.stringify({ label: 'header', flag: 'CLI' }));
      con.on('data', (res) => {
        console.log(res);
        const data = JSON.parse(res);
        console.log('RECIEVE data', data);
        if (data.label === 'header') {
          if (data.flag === 'ACK') {
            const myplayerid = data.payload;
            store.dispatch(actions.setMyPlayerID(myplayerid));
            this.setState({ mypid: myplayerid });
            console.log('connect success.');
            if (this.props.history) {
              this.props.history.push('/tetris');
            }
          }
        } else if (data.label === 'start') {
          console.log(data);
          states.start();
          console.log('started!');
        } else if (data.label === 'syncgame') {
          if (data.team === ((this.state.mypid <= 1) ? 'LEFT' : 'RIGHT')) {
            if (data.attr === 'matrix') {
              // console.log('matrix');
              let newMatrix = List();
              data.data.forEach((m) => {
                newMatrix = newMatrix.push(List(m));
              });
              store.dispatch(actions.matrix(newMatrix));
            } else if (data.attr === 'cur2') {
              if (data.data === null) {
                const newCur = data.data;
                let newShape = List();
                newCur.shape.forEach((m) => {
                  newShape = newShape.push(List(m));
                });
                const next = {
                  shape: newShape,
                  type: newCur.type,
                  xy: newCur.xy,
                  rotateIndex: newCur.rotateIndex,
                  timeStamp: newCur.timeStamp,
                };
                // console.log(next);
                store.dispatch(actions.moveBlock2(next));
              } else {
                store.dispatch(actions.moveBlock2({ reset: true }));
              }
            } else if (data.attr === 'cur') {
              if (data.data === null) {
                const newCur = data.data;
                let newShape = List();
                newCur.shape.forEach((m) => {
                  newShape = newShape.push(List(m));
                });
                const next = {
                  shape: newShape,
                  type: newCur.type,
                  xy: newCur.xy,
                  rotateIndex: newCur.rotateIndex,
                  timeStamp: newCur.timeStamp,
                };
                // console.log(next);
                store.dispatch(actions.moveBlock(next));
              } else {
                store.dispatch(actions.moveBlock({ reset: true }));
              }
            }
          } else if (data.attr === 'matrix') {
            // console.log('matrix');
            let newMatrix = List();
            data.data.forEach((m) => {
              newMatrix = newMatrix.push(List(m));
            });
            store.dispatch(actions.matrixOppo(newMatrix));
          } else if (data.attr === 'cur2') {
            // console.log('cur2');
            if (data.data === null) {
              const newCur = data.data;
              let newShape = List();
              newCur.shape.forEach((m) => {
                newShape = newShape.push(List(m));
              });
              const next = {
                shape: newShape,
                type: newCur.type,
                xy: newCur.xy,
                rotateIndex: newCur.rotateIndex,
                timeStamp: newCur.timeStamp,
              };
              // console.log(next);
              store.dispatch(actions.moveBlockOppo2(next));
            } else {
              store.dispatch(actions.moveBlockOppo2({ reset: true }));
            }
          } else if (data.attr === 'cur') {
            if (data.data === null) {
              const newCur = data.data;
              let newShape = List();
              newCur.shape.forEach((m) => {
                newShape = newShape.push(List(m));
              });
              const next = {
                shape: newShape,
                type: newCur.type,
                xy: newCur.xy,
                rotateIndex: newCur.rotateIndex,
                timeStamp: newCur.timeStamp,
              };
              // console.log(next);
              store.dispatch(actions.moveBlockOppo(next));
            } else {
              store.dispatch(actions.moveBlockOppo({ reset: true }));
            }
          }
        }
      });
      con.on('close', () => {
        con.close();
        console.log(`${con.peer} has left the chat.`);
      });
    });
    con.on('error', (err) => {
      console.log(err);
    });
  }

  connectOpp(id) {
    this.setState({
      opp: id,
    });
    const con = this.state.peer.connect(id, {
      label: 'chat',
      serialization: 'none',
      metadata: {
        message: 'hi i want to chat with you!',
      },
    });
    const stateConns = store.getState().get('peerConnection').conns;
    const connsCopy = stateConns.slice();
    connsCopy.push(con);
    const stateConnsT = store.getState().get('peerConnection').connsTarget;
    const connsTCopy = stateConnsT.slice();
    connsTCopy.push('opp');
    store.dispatch(actions.peerSaveConnection({ conn: connsCopy, target: connsTCopy }));
    this.setState({ conns: [...this.state.conns, con] });
    con.on('open', () => {
      console.log('connection opened.');
      con.send(JSON.stringify({ label: 'header', flag: 'OPP' }));
      con.on('data', (res) => {
        console.log(res);
        const data = JSON.parse(res);
        console.log('RECIEVE data', data);
        if (data.label === 'header') {
          if (data.flag === 'ACK_OPP') {
            const myplayerid = data.payload;
            store.dispatch(actions.setMyPlayerID(myplayerid));
            this.setState({ mypid: myplayerid });
            console.log('connect success.');
            stateConnsT.forEach((m, k) => {
              if (m === 'fd') {
                stateConns[k].send(JSON.stringify({
                  label: 'header',
                  flag: 'ACK',
                  payload: 3,
                }));
              }
            });
            if (this.props.history) {
              this.props.history.push('/tetris');
            }
          }
        } else if (data.label === 'start') {
          console.log(data);
          states.start();
          console.log('started!');
        } else if (data.label === 'linesSent') {
          if (data.team === 'RIGHT') {
            store.dispatch({ type: reducerType.LINES_RECEIVED, data: data.data });
          }
        } else if (data.label === 'syncmove') {
          todo[data.key].down(store, data.id);
          todo[data.key].up(store);
        } else if (data.label === 'syncgame') {
          if (data.team === 'LEFT') {
            if (data.attr === 'matrix') {
              // console.log('matrix');
              let newMatrix = List();
              data.data.forEach((m) => {
                newMatrix = newMatrix.push(List(m));
              });
              store.dispatch(actions.matrixOppo(newMatrix));
            } else if (data.attr === 'cur2') {
              // console.log('cur2');
              if (data.data === null) {
                const newCur = data.data;
                let newShape = List();
                newCur.shape.forEach((m) => {
                  newShape = newShape.push(List(m));
                });
                const next = {
                  shape: newShape,
                  type: newCur.type,
                  xy: newCur.xy,
                  rotateIndex: newCur.rotateIndex,
                  timeStamp: newCur.timeStamp,
                };
                // console.log(next);
                store.dispatch(actions.moveBlockOppo2(next));
              } else {
                store.dispatch(actions.moveBlockOppo2({ reset: true }));
              }
            } else if (data.attr === 'cur') {
              if (data.data === null) {
                const newCur = data.data;
                let newShape = List();
                newCur.shape.forEach((m) => {
                  newShape = newShape.push(List(m));
                });
                const next = {
                  shape: newShape,
                  type: newCur.type,
                  xy: newCur.xy,
                  rotateIndex: newCur.rotateIndex,
                  timeStamp: newCur.timeStamp,
                };
                // console.log(next);
                store.dispatch(actions.moveBlockOppo(next));
              } else {
                store.dispatch(actions.moveBlockOppo({ reset: true }));
              }
            }
            store.getState().get('peerConnection').connsTarget.forEach((m, k) => {
              if (m === 'fd') {
                store.getState().get('peerConnection').conns[k].send(res);
              }
            });
          }
        }
      });
      con.on('close', () => {
        con.close();
        console.log(`${con.peer} has left the chat.`);
      });
    });
    con.on('error', (err) => {
      console.log(err);
    });
  }

  regClick() {
    if (this.modal && this.modal.value) {
      this.register(this.modal.value);
    }
    // console.log(this.state.peer, this.state.conns);
  }

  connClick() {
    if (this.modal2 && this.modal2.value) {
      this.connect(this.modal2.value);
    }
  }

  connClickOpp() {
    if (this.modal3 && this.modal3.value) {
      this.connectOpp(this.modal3.value);
    }
  }

  changeConfig() {
    if (this.modal4 && this.modal4.value) {
      this.setState({ config: JSON.parse(this.modal4.value) });
    }
  }

  render() {
    // console.log(JSON.stringify(this.state.conn));
    return (
      <div>
        <p>Peerjs in use</p>
        <p>config: { JSON.stringify(this.state.config) }</p>
        <p>myid: { this.state.id }</p>
        <p>fdid: { this.state.fd }</p>
        <p>oppid: { this.state.opp }</p>
        <p>Config:
        <input
          id="config"
          type="text"
          defaultValue={JSON.stringify(this.state.config)}
          ref={(m) => { this.modal4 = m; }}
        />
          <button onClick={this.changeConfig}>Use this config</button>
        </p>
        <p>Choose your ID:
          <input id="myid" type="text" ref={(m) => { this.modal = m; }} />
          <button onClick={this.regClick}>Register</button>
        </p>
        <p>Connect to a friend:
          <input id="fdid" type="text" ref={(m) => { this.modal2 = m; }} />
          <button onClick={this.connClick}>Connect</button>
        </p>
        <p>Connect to an opponent:
          <input id="oppid" type="text" ref={(m) => { this.modal3 = m; }} />
          <button onClick={this.connClickOpp}>Connect Opp</button>
        </p>
        <Link
          to={{
            pathname: '/tetris',
          }}
        >Home</Link>
      </div>
    );
  }
}

Peer.statics = {
  timeout: null,
};

Peer.propTypes = {
  history: propTypes.object,
  cur: propTypes.bool,
  max: propTypes.number,
  point: propTypes.number,
};
