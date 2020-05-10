import React from 'react';
import PropTypes from 'prop-types';

import styles from './index.less';

class PeerJsConnectionForm extends React.PureComponent {
    static propTypes = {
        shouldLockMyId: PropTypes.bool.isRequired,
        shouldLockTeammateId: PropTypes.bool.isRequired,
        shouldLockOpponentLeaderId: PropTypes.bool.isRequired,

        onRegisterSelf: PropTypes.func.isRequired,
        onRegisterFriend: PropTypes.func.isRequired,
        onRegisterOpponent: PropTypes.func.isRequired,
        onError: PropTypes.func.isRequired,
    }

    static defaultProps = {
        shouldLockMyId: false,
        shouldLockTeammateId: false,
        shouldLockOpponentLeaderId: false,
    }

    constructor(props) {
        super(props);

        this.state = {
            myId: '',
            teammateId: '',
            opponentId: '',
        };
    }

    _handleRegister = (event) => {
        const name = event.target.name;
        const {
            onRegisterSelf,
            onRegisterFriend,
            onRegisterOpponent,
            onError,
        } = this.props;

        if (name === 'myId') {
            return onRegisterSelf(event, this.state[name]);
        } else if (name === 'teammateId') {
            return onRegisterFriend(event, this.state[name]);
        } else if (name === 'opponentId') {
            return onRegisterOpponent(event, this.state[name]);
        }

        onError && onError('PeerJsConnectionForm _handleRegister error');
    }

    _handleConnectionChange = (event) => {
        const name = event.target.name;
        const value = event.target.value;

        if (!['myId', 'teammateId', 'opponentId'].includes(name)) {
            // return irrelevant
            return;
        }

        this.setState({
            [name]: value,
        });
    }

    render() {
        const {
            shouldLockMyId,
            shouldLockTeammateId,
            shouldLockOpponentLeaderId,
        } = this.props;

        return (
            <div className={styles.form}>
                <p>Choose your ID:
                    <input
                        name="myId"
                        type="text"
                        onChange={this._handleConnectionChange}
                        disabled={shouldLockMyId}
                    />
                    <button
                        name="myId"
                        onClick={this._handleRegister}
                        disabled={shouldLockMyId}
                    >
                        Register
                    </button>
                </p>
                <p>Connect to a friend:
                    <input
                        name="teammateId"
                        type="text"
                        onChange={this._handleConnectionChange}
                        disabled={shouldLockTeammateId}
                    />
                    <button
                        name="teammateId"
                        onClick={this._handleRegister}
                        disabled={shouldLockTeammateId}
                    >
                        Connect teammate
                    </button>
                </p>
                <p>Connect to an opponent:
                    <input
                        name="opponentId"
                        type="text"
                        onChange={this._handleConnectionChange}
                        disabled={shouldLockOpponentLeaderId}
                    />
                    <button
                        name="opponentId"
                        onClick={this._handleRegister}
                        disabled={shouldLockOpponentLeaderId}
                    >
                        Connect opponent
                    </button>
                </p>
            </div>
        );
    }
}

export default PeerJsConnectionForm;
