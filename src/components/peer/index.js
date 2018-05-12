import React from 'react';
import propTypes from 'prop-types';
import { Link } from 'react-router-dom';
import Peerjs from 'peerjs';
import store from '../../store';
import actions from '../../actions';

export default class Peer extends React.Component {
  constructor() {
    super();
    this.state = {
      id: '',
      opp: '',
      conns: [],
      peer: null,
    };
    this.register = this.register.bind(this);
    this.connect = this.connect.bind(this);
    this.regClick = this.regClick.bind(this);
    this.connClick = this.connClick.bind(this);
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

      // Set highest debug level (log everything!).
      debug: 3,
    });
    console.log('Peer', peer);
    store.dispatch(actions.peerSavePeer(peer));
    this.setState({
      id,
      peer,
    }, () => {
      this.state.peer.on('connection', (c) => {
        c.on('open', () => {
          console.log('someone connected.');
          this.setState({ conns: [...this.state.conns, c] });
          c.send(JSON.stringify({ label: 'header', payload: 'ACK' }));
          c.on('data', (data) => {
            alert(data);
            console.log(data);
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
      opp: id,
    });
    const con = this.state.peer.connect(id, {
      label: 'chat',
      serialization: 'none',
      metadata: {
        message: 'hi i want to chat with you!',
      },
    });
    const stateConns = store.getState().peerConnection.conn;
    const connsCopy = stateConns.slice();
    connsCopy.push(con);
    store.dispatch(actions.peerSaveConnection(connsCopy));
    this.setState({ conns: [...this.state.conns, con] });
    con.on('open', () => {
      con.on('data', (res) => {
        console.log(res);
        const data = JSON.parse(res);
        if (data.label === 'header') {
          if (data.payload === 'ACK') {
            console.log('connect success.');
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
    console.log(this.state.peer, this.state.conns);
  }

  connClick() {
    if (this.modal2 && this.modal2.value) {
      this.connect(this.modal2.value);
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
          <button onClick={this.regClick}>Register</button>
        </p>
        <p>Connect to an ID:
          <input id="oppid" type="text" ref={(m) => { this.modal2 = m; }} />
          <button onClick={this.connClick}>Connect</button>
        </p>
        <Link
          to={{
            pathname: '/tetris',
            state: { peer: this.state.peer, conns: this.state.conns },
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
  cur: propTypes.bool,
  max: propTypes.number,
  point: propTypes.number,
};

