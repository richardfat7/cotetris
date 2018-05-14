import React from 'react';
import propTypes from 'prop-types';
import { Link } from 'react-router-dom';
import Peerjs from 'peerjs';
import { want } from '../../unit';
import store from '../../store';
import actions from '../../actions';
import * as reducerType from '../../unit/reducerType';


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
    this.getCurType = this.getCurType.bind(this);
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
  getCurType(playerid, storeStates) {
    let type; let cur;
    if (playerid === 0) {
      type = reducerType.MOVE_BLOCK;
      cur = storeStates.get('cur');
    } else if (playerid === 1) {
      type = reducerType.MOVE_BLOCK2;
      cur = storeStates.get('cur2');
    } else if (playerid === 2) {
      type = reducerType.MOVE_BLOCK_OPPO;
      cur = storeStates.get('curOppo');
    } else if (playerid === 3) {
      type = reducerType.MOVE_BLOCK_OPPO2;
      cur = storeStates.get('curOppo2');
    }
    return { type, cur };
  }

  register(id) {
    const peer = new Peerjs(id, {
      host: 'localhost',
      port: 9000,
      path: '/',

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
      this.state.peer.on('connection', (con) => {
        let myplayerid = store.getState().get('myplayerid');
        let teamConns; let oppoConns; let connsCopy;
        if (con.metadata.payload === 'team_req') {
          teamConns = store.getState().get('peerConnection').teamConns;
          connsCopy = teamConns.slice();
          connsCopy.push(con);
          store.dispatch(actions.peerSaveTeammate(connsCopy));
        } else if (con.metadata.payload === 'oppo_req') {
          oppoConns = store.getState().get('peerConnection').oppoConns;
          connsCopy = oppoConns.slice();
          connsCopy.push(con);
          store.dispatch(actions.peerSaveOpponent(connsCopy));
        } else {
          console.log('dont understand ', con.metadata.payload);
        }
        con.on('open', () => {
          console.log('someone opened connection.');
          // payload is player's id
          const lastPlayer = this.state.currentplayerid + 1;
          this.setState({ lastPlayer });
          if (con.metadata.payload === 'team_req') {
            con.send(JSON.stringify({
              label: 'header',
              flag: 'SET',
              payload: lastPlayer,
              from: 1,
            }));
          } else if (con.metadata.payload === 'oppo_req') {
            con.send(JSON.stringify({
              label: 'header',
              flag: 'SET',
              payload: 2,
              from: 1,
            }));
          }
          con.on('data', (res) => {
            console.log(res);
            const data = JSON.parse(res);
            const storeStates = store.getState();
            teamConns = storeStates.get('peerConnection').teamConns;
            oppoConns = storeStates.get('peerConnection').oppoConns;
            console.log(teamConns, oppoConns);
            // send to client if you are host
            if (this.state.identity === 0 && data.flag !== 'SET') {
              for (let i = 0; i < teamConns.length; i++) {
                teamConns[i].send(res);
              }
            }
            if (data.label === 'header') {
              if (data.flag === 'ACK' && data.from === 2) {
                console.log('HAHA');
                for (let i = 0; i < oppoConns.length; i++) {
                  console.log('ha2');
                  oppoConns[i].send(JSON.stringify({
                    label: 'header',
                    flag: 'STA',
                    from: myplayerid,
                  }));
                }
                for (let i = 0; i < teamConns.length; i++) {
                  console.log('ha2');
                  teamConns[i].send(JSON.stringify({
                    label: 'header',
                    flag: 'STA',
                    from: myplayerid,
                  }));
                }
                if (this.props.history) {
                  this.props.history.push('/tetris');
                }
              } else if (data.flag === 'SET') {
                myplayerid = data.payload;
                store.dispatch(actions.setMyPlayerID(myplayerid));
                console.log('connect success.');
                con.send(JSON.stringify({ label: 'header', flag: 'ACK', from: myplayerid }));
              } else if (data.flag === 'STA') {
                console.log('STA');
                if (this.props.history) {
                  this.props.history.push('/tetris');
                }
              } else if (data.flag === 'RST') {
                console.log('RST');
              } else if (data.flag === 'RDY') {
                for (let i = 0; i < oppoConns.length; i++) {
                  oppoConns[i].send(JSON.stringify({
                    label: 'header',
                    flag: 'STA',
                    from: myplayerid,
                  }));
                }
                for (let i = 0; i < teamConns.length; i++) {
                  teamConns[i].send(JSON.stringify({
                    label: 'header',
                    flag: 'STA',
                    from: myplayerid,
                  }));
                }
                if (this.props.history) {
                  this.props.history.push('/tetris');
                }
              }
            } else if (data.label === 'movement') {
              const playerid = data.playerid;
              const { type, cur } = this.getCurType(playerid, storeStates);
              console.log(type, cur);
              const direction = data.payload;
              if (cur && (direction === 'left')) {
                store.dispatch(actions.moveBlockGeneral(cur.left(), type));
              } else if (cur && (direction === 'right')) {
                store.dispatch(actions.moveBlockGeneral(cur.right(), type));
              } else if (cur && (direction === 'rotate')) {
                store.dispatch(actions.moveBlockGeneral(cur.rotate(), type));
              } else if (cur && (direction === 'space')) {
                let index = 0;
                let bottom = cur.fall(index);
                while (want(bottom, store.getState().get('matrix'))) {
                  bottom = cur.fall(index);
                  index++;
                }
                bottom = cur.fall(index - 2);
                store.dispatch(actions.moveBlockGeneral(bottom, type));
              } else if (cur && (direction === 'down')) {
                store.dispatch(actions.moveBlockGeneral(cur.fall(), type));
              }
            } else if (data.label === 'game') {
              console.log('game');
            }
          });
          con.on('close', () => {
            con.close();
            console.log(`${con.peer} has left the chat.`);
          });
        });
      });
    });
  }

  connect(id, isOpponent) {
    if (isOpponent) {
      this.setState({
        opp: id,
        identity: 0,
      });
    } else {
      this.setState({
        opp: id,
        identity: 1,
      });
    }
    const con = this.state.peer.connect(id, {
      label: 'chat',
      serialization: 'none',
      metadata: {
        payload: isOpponent ? 'oppo_req' : 'team_req',
      },
    });
    let connsCopy;
    let oppoConns = store.getState().get('peerConnection').oppoConns;
    let teamConns = store.getState().get('peerConnection').teamConns;
    if (isOpponent) {
      connsCopy = oppoConns.slice();
      connsCopy.push(con);
      store.dispatch(actions.peerSaveOpponent(connsCopy));
      teamConns[0].send(JSON.stringify({ label: 'header', flag: 'SET', payload: 3, from: 2 }));
      store.dispatch(actions.setMyPlayerID(2));
    } else {
      connsCopy = teamConns.slice();
      connsCopy.push(con);
      store.dispatch(actions.peerSaveTeammate(connsCopy));
    }
    con.on('open', () => {
      console.log('connection opened.');
      con.on('data', (res) => {
        console.log(res);
        const data = JSON.parse(res);
        const storeStates = store.getState();
        teamConns = storeStates.get('peerConnection').teamConns;
        oppoConns = storeStates.get('peerConnection').oppoConns;
        console.log(teamConns, oppoConns);
        let myplayerid = storeStates.get('myplayerid');
        // send to client if you are host
        if (this.state.identity === 0 && data.flag !== 'SET') {
          for (let i = 0; i < teamConns.length; i++) {
            teamConns[i].send(res);
          }
        }
        if (data.label === 'header') {
          if (data.flag === 'ACK' && data.from === 2) {
            console.log('HAHA');
            for (let i = 0; i < oppoConns.length; i++) {
              console.log('ha1');
              oppoConns[i].send(JSON.stringify({
                label: 'header',
                flag: 'STA',
                from: myplayerid,
              }));
            }
            for (let i = 0; i < teamConns.length; i++) {
              console.log('ha1');
              teamConns[i].send(JSON.stringify({
                label: 'header',
                flag: 'STA',
                from: myplayerid,
              }));
            }
            if (this.props.history) {
              this.props.history.push('/tetris');
            }
          } else if (data.flag === 'SET') {
            myplayerid = data.payload;
            store.dispatch(actions.setMyPlayerID(myplayerid));
            console.log('connect success.');
            con.send(JSON.stringify({ label: 'header', flag: 'ACK', from: myplayerid }));
          } else if (data.flag === 'STA') {
            console.log('STA');
            if (this.props.history) {
              this.props.history.push('/tetris');
            }
          } else if (data.flag === 'RST') {
            console.log('RST');
          } else if (data.flag === 'RDY') {
            for (let i = 0; i < oppoConns.length; i++) {
              oppoConns[i].send(JSON.stringify({
                label: 'header',
                flag: 'STA',
                from: myplayerid,
              }));
            }
            for (let i = 0; i < teamConns.length; i++) {
              teamConns[i].send(JSON.stringify({
                label: 'header',
                flag: 'STA',
                from: myplayerid,
              }));
            }
            if (this.props.history) {
              this.props.history.push('/tetris');
            }
          }
        } else if (data.label === 'movement') {
          const playerid = data.playerid;
          const { type, cur } = this.getCurType(playerid, storeStates);
          console.log(type, cur);
          const direction = data.payload;
          if (cur && (direction === 'left')) {
            store.dispatch(actions.moveBlockGeneral(cur.left(), type));
          } else if (cur && (direction === 'right')) {
            store.dispatch(actions.moveBlockGeneral(cur.right(), type));
          } else if (cur && (direction === 'rotate')) {
            store.dispatch(actions.moveBlockGeneral(cur.rotate(), type));
          } else if (cur && (direction === 'space')) {
            let index = 0;
            let bottom = cur.fall(index);
            while (want(bottom, store.getState().get('matrix'))) {
              bottom = cur.fall(index);
              index++;
            }
            bottom = cur.fall(index - 2);
            store.dispatch(actions.moveBlockGeneral(bottom, type));
          } else if (cur && (direction === 'down')) {
            store.dispatch(actions.moveBlockGeneral(cur.fall(), type));
          }
        } else if (data.label === 'game') {
          console.log('game');
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

  connClickTeam() {
    if (this.modal2 && this.modal2.value) {
      this.connect(this.modal2.value, false);
    }
  }

  connClickOppo() {
    if (this.modal2 && this.modal2.value) {
      this.connect(this.modal2.value, true);
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
