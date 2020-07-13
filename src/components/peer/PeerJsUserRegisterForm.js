import React from 'react';
import PropTypes from 'prop-types';

const ConnectionOption = {
    HOST_LOBBY: 'HOST_LOBBY',
    JOIN_LOBBY: 'JOIN_LOBBY',
};

class PeerJsUserRegisterForm extends React.PureComponent {
    static propTypes = {
        onRegisterHost: PropTypes.func.isRequired,
        onRegisterJoin: PropTypes.func.isRequired,
    };

    constructor(props) {
        super(props);

        this.state = {
            option: ConnectionOption.JOIN_LOBBY,
            lobbyId: '',
            displayName: '',
        };
    }

    _handleInputChange = (event) => {
        const name = event.target.name;
        const value = event.target.value;

        this.setState({ [name]: value });
    }

    _handleCheckboxChange = (event) => {
        this.setState((state) => ({
            option: (state.option === ConnectionOption.JOIN_LOBBY ? ConnectionOption.HOST_LOBBY : ConnectionOption.JOIN_LOBBY),
        }));
    }

    _handleFormSubmit = (event) => {
        const { option, lobbyId, displayName } = this.state;
        const isHosting = (option === ConnectionOption.HOST_LOBBY);

        event.preventDefault();

        if (isHosting) {
            this.props.onRegisterHost(event, lobbyId, displayName);
        } else {
            this.props.onRegisterJoin(event, lobbyId, displayName);
        }
    }

    render() {
        const { option, displayName, lobbyId } = this.state;
        const isHosting = (option === ConnectionOption.HOST_LOBBY);
        const isAllFilled = displayName && lobbyId;

        const lobbyIdPlaceholder = isHosting ? 'new lobby id' : 'target lobby id';

        return (
            <form onSubmit={this._handleFormSubmit}>
                Host lobby?
                <input type="checkbox" value={isHosting} onChange={this._handleCheckboxChange} />
                { isHosting ? 'Yes' : 'No'}
                <br />
                Lobby id: <input name="lobbyId" placeholder={lobbyIdPlaceholder} onChange={this._handleInputChange} />
                <br />
                Display name: <input name="displayName" placeholder="display name" onChange={this._handleInputChange}/>
                <br />
                <input type="submit" disabled={!isAllFilled} value={isHosting ? 'Host' : 'Join'} />
            </form>
        );
    }
}

export default PeerJsUserRegisterForm;
