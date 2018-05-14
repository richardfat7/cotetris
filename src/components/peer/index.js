import { List } from 'immutable';
import React from 'react';
import propTypes from 'prop-types';
import { Link } from 'react-router-dom';
import Peerjs from 'peerjs';
// import { want } from '../../unit';
import store from '../../store';
import states from '../../control/states';
import actions from '../../actions';
// import * as reducerType from '../../unit/reducerType';

// function getTypeCur(storeStates, playerid) {
//   let type; let cur;
//   if (playerid === 0) {
//     type = reducerType.MOVE_BLOCK;
//     cur = storeStates.cur;
//   } else if (playerid === 1) {
//     type = reducerType.MOVE_BLOCK2;
//     cur = storeStates.cur2;
//   } else if (playerid === 2) {
//     type = reducerType.MOVE_BLOCK_OPPO;
//     cur = storeStates.curOppo;
//   } else if (playerid === 3) {
//     type = reducerType.MOVE_BLOCK_OPPO2;
//     cur = storeStates.curOppo2;
//   }
//   return { type, cur };
// }

export default class Peer extends React.Component {
  constructor() {
    super();
    this.state = {
      currentplayerid: 0,
      id: '',
      opp: '',
      conns: [],
      peer: null,
      identity: 0,
    };
    this.register = this.register.bind(this);
    this.connect = this.connect.bind(this);
    this.regClick = this.regClick.bind(this);
    this.connClickTeam = this.connClickTeam.bind(this);
    this.connClickOppo = this.connClickOppo.bind(this);
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
    const peer = new Peerjs(id, {
      host: 'localhost',
      port: 9000,
      path: '/',
      identity: 0, // decides if you propagate your packet
      // Set highest debug level (log everything!).
      debug: 3,
    });
    console.log('Peer', peer);
    store.dispatch(actions.peerSavePeer(peer));
    this.setState({
      id,
      peer,
      identity: 0,
    }, () => {
      let myplayerid = store.getState().get('myplayerid');
      this.state.peer.on('connection', (c) => {
        const stateConns = store.getState().get('peerConnection').conns;
        const connsCopy = stateConns.slice();
        connsCopy.push(c);
        store.dispatch(actions.peerSaveConnection(connsCopy));
        c.on('open', () => {
          console.log('someone opened connection.');
          myplayerid = store.getState().get('myplayerid');
          if (c.metadata.type === 'team_req') {
            const setPacket = JSON.stringify({
              label: 'header',
              flag: 'SET',
              payload: 1,
              from: myplayerid,
            });
            c.send(setPacket);
          } else if (c.metadata.type === 'oppo_req') {
            const setPacket = JSON.stringify({
              label: 'header',
              flag: 'SET',
              payload: 2,
              from: myplayerid,
            });
            c.send(setPacket);
          } else {
            console.log('cannot understand metadata ', c);
          }
          c.on('data', (res) => {
            const data = JSON.parse(res);
            console.log('RECIEVE data', data);
            const storeStates = store.getState();
            const conns = storeStates.get('peerConnection').conns;
            myplayerid = storeStates.get('myplayerid');
            // propagate to teammate if I am one of the host: 0
            if (this.state.identity === 0 && data.flag === 'STA') {
              for (let i = 0; i < conns.length; i++) {
                if (conns[i].metadata.type === 'team_req') {
                  conns[i].send(res);
                } else if (conns[i].metadata.type === 'oppo_req') {
                  // no need to propagate to opponent's host :o)
                } else {
                  console.log('Cannot understand metadata ', res);
                }
              }
            }
            if (data.label === 'header') {
              if (data.flag === 'SET') {
                myplayerid = data.payload;
                store.dispatch(actions.setMyPlayerID(myplayerid));
                const ackPacket = JSON.stringify({
                  label: 'header',
                  flag: 'ACK',
                  from: myplayerid,
                });
                for (let i = 0; i < conns.length; i++) {
                  conns[i].send(ackPacket);
                }
              } else if (data.flag === 'ACK' && data.from === 2) {
                const staPacket = JSON.stringify({
                  label: 'header',
                  flag: 'STA',
                  from: myplayerid,
                });
                for (let i = 0; i < conns.length; i++) {
                  conns[i].send(staPacket);
                }
                if (this.props.history) {
                  this.props.history.push('/tetris');
                }
              } else if (data.flag === 'STA') {
                if (this.props.history) {
                  this.props.history.push('/tetris');
                }
              }
            } else if (data.label === 'movement') { // deprecated
              // const playerid = data.playerid;
              // const { type, cur } = getTypeCur(storeStates, playerid)
              // console.log(type, cur);
              // const direction = data.payload;
              // if (cur && direction === 'left') {
              //   store.dispatch(actions.moveBlockGeneral(cur.left(), type));
              // } else if (cur && direction === 'right') {
              //   store.dispatch(actions.moveBlockGeneral(cur.right(), type));
              // } else if (cur && direction === 'rotate') {
              //   store.dispatch(actions.moveBlockGeneral(cur.rotate(), type));
              // } else if (cur && direction === 'space') {
              //   let index = 0;
              //   let bottom = cur.fall(index);
              //   while (want(bottom, store.getState().get('matrix'))) {
              //     bottom = cur.fall(index);
              //     index++;
              //   }
              //   bottom = cur.fall(index - 2);
              //   store.dispatch(actions.moveBlockGeneral(bottom, type));
              // } else if (cur && direction === 'down') {
              //   store.dispatch(actions.moveBlockGeneral(cur.fall(), type));
              // }
            } else if (data.label === 'start') {
              console.log(data);
              states.start();
              console.log('started!');
            } else if (data.label === 'syncgame') {
              if (data.attr === 'matrix') {
                console.log('matrix');
                let newMatrix = List();
                data.data.forEach((m) => {
                  newMatrix = newMatrix.push(List(m));
                });
                store.dispatch(actions.matrix(newMatrix));
              } else if (data.attr === 'cur2') {
                console.log('cur2');
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
                console.log(next);
                store.dispatch(actions.moveBlock2(next));
              }
            } else if (data.label === 'syncmove') {
              console.log(data.key);
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

  connect(id, isOpponent) {
    this.setState({
      opp: id,
      identity: isOpponent ? 0 : 1,
    });
    const c = this.state.peer.connect(id, {
      label: 'chat',
      metadata: {
        type: isOpponent ? 'oppo_req' : 'team_req',
      },
    });
    console.log('Connection', c);
    const stateConns = store.getState().get('peerConnection').conns;
    const connsCopy = stateConns.slice();
    connsCopy.push(c);
    store.dispatch(actions.peerSaveConnection(connsCopy));
    if (isOpponent) { // other host is id 2
      const myplayerid = 2;
      store.dispatch(actions.setMyPlayerID(myplayerid));
      const conns = store.getState().get('peerConnection').conns;
      const setPacket = JSON.stringify({
        label: 'header',
        flag: 'SET',
        payload: 3,
        from: myplayerid,
      });
      for (let i = 0; i < conns.length; i++) {
        if (conns[i].metadata.type === 'team_req') {
          conns[i].send(setPacket);
        }
      }
    } else {
      const myplayerid = 1;
      store.dispatch(actions.setMyPlayerID(myplayerid));
    }
    c.on('open', () => {
      console.log('connection opened.');
      c.on('data', (res) => {
        console.log(res);
        const data = JSON.parse(res);
        const storeStates = store.getState();
        const conns = storeStates.get('peerConnection').conns;
        let myplayerid = storeStates.get('myplayerid');
        // propagate to teammate if I am one of the host: 0
        if (this.state.identity === 0 && data.flag === 'STA') {
          for (let i = 0; i < conns.length; i++) {
            if (conns[i].metadata.type === 'team_req') {
              conns[i].send(res);
            } else if (conns[i].metadata.type === 'oppo_req') {
              // no need to propagate to opponent's host :o)
            } else {
              console.log('Cannot understand metadata ', res);
            }
          }
        }
        if (data.label === 'header') {
          if (data.flag === 'SET') {
            myplayerid = data.payload;
            store.dispatch(actions.setMyPlayerID(myplayerid));
            const ackPacket = JSON.stringify({
              label: 'header',
              flag: 'ACK',
              from: myplayerid,
            });
            for (let i = 0; i < conns.length; i++) {
              conns[i].send(ackPacket);
            }
          } else if (data.flag === 'ACK' && data.from === 2) {
            const staPacket = JSON.stringify({
              label: 'header',
              flag: 'STA',
              from: myplayerid,
            });
            for (let i = 0; i < conns.length; i++) {
              conns[i].send(staPacket);
            }
            if (this.props.history) {
              this.props.history.push('/tetris');
            }
          } else if (data.flag === 'STA') {
            if (this.props.history) {
              this.props.history.push('/tetris');
            }
          }
        } else if (data.label === 'movement') { // deprecated
          // const playerid = data.playerid;
          // const { type, cur } = getTypeCur(storeStates, playerid)
          // console.log(type, cur);
          // const direction = data.payload;
          // if (cur && direction === 'left') {
          //   store.dispatch(actions.moveBlockGeneral(cur.left(), type));
          // } else if (cur && direction === 'right') {
          //   store.dispatch(actions.moveBlockGeneral(cur.right(), type));
          // } else if (cur && direction === 'rotate') {
          //   store.dispatch(actions.moveBlockGeneral(cur.rotate(), type));
          // } else if (cur && direction === 'space') {
          //   let index = 0;
          //   let bottom = cur.fall(index);
          //   while (want(bottom, store.getState().get('matrix'))) {
          //     bottom = cur.fall(index);
          //     index++;
          //   }
          //   bottom = cur.fall(index - 2);
          //   store.dispatch(actions.moveBlockGeneral(bottom, type));
          // } else if (cur && direction === 'down') {
          //   store.dispatch(actions.moveBlockGeneral(cur.fall(), type));
          // }
        } else if (data.label === 'start') {
          console.log(data);
          states.start();
          console.log('started!');
        } /* else if (data.label === 'syncgame') {
          console.log('syncgame');
          let newMatrix = List();
          data.matrix.forEach((m) => {
            newMatrix = newMatrix.push(List(m));
          });
          console.log(newMatrix);
          store.dispatch(actions.matrix(newMatrix));
        } */
      });
      c.on('close', () => {
        c.close();
        console.log(`${c.peer} has left the chat.`);
      });
    });
    c.on('error', (err) => {
      console.log(err);
    });
  }

  regClick() {
    if (this.modal && this.modal.value) {
      this.register(this.modal.value);
    }
    // console.log(this.state.peer, this.state.conns);
  }

  connClickOppo() {
    if (this.modal2 && this.modal2.value) {
      this.connect(this.modal2.value, true);
    }
  }

  connClickTeam() {
    if (this.modal2 && this.modal2.value) {
      this.connect(this.modal2.value, false);
    }
  }

  render() {
    // console.log(JSON.stringify(this.state.conn));
    return (
      <div>
        <p>Peerjs in use</p>
        <p>myid: { this.state.id }</p>
        <p>oppid: { this.state.opp }</p>
        <p>Choose an ID:
          <input id="myid" type="text" ref={(m) => { this.modal = m; }} />
          <button onClick={this.regClick} style={{ marginLeft: 8 }}>
            Register
          </button>
        </p>
        <p>Connect to an ID:
          <input id="oppid" type="text" ref={(m) => { this.modal2 = m; }} />
          <button onClick={this.connClickTeam} style={{ marginLeft: 8 }}>
            Connect as teammate
          </button>
          <button onClick={this.connClickOppo} style={{ marginLeft: 8 }}>
            Connect as opponent
          </button>
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
