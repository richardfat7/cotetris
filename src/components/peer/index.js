import React from 'react';
import propTypes from 'prop-types';

import Peerjs from 'peerjs';

export default class Peer extends React.Component {
  constructor() {
    super();
    this.state = {
      id: '',
      opp: '',
      conn: '',
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
    this.setState({
      id,
      conn: new Peerjs(id, {
        host: 'localhost',
        port: 9000,
        path: '/',

        // Set highest debug level (log everything!).
        debug: 3,
      }),
    }, () => {
      this.state.conn.on('connection', (c) => {
        c.on('open', () => {
          c.on('data', (data) => {
            alert(data);
            console.log(data);
          });
          c.on('close', () => {
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
    const con = this.state.conn.connect(id, {
      label: 'chat',
      serialization: 'none',
      metadata: {
        message: 'hi i want to chat with you!',
      },
    });
    con.on('open', () => {
      con.on('data', (data) => {
        console.log(data);
      });
      con.on('close', () => {
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

