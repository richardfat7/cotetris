import { connect } from 'react-redux';
import Peer from './Peer';

import actions from '../../actions';

const mapStateToProps = (state) => {
    const { peerConnection } = state;

    return {
        peerConnection,
    };
};

const mapDispatchToProps = (dispatch) => ({
    onRegister: (member, lobbyId, isHosting) => {
        dispatch(actions.peerOnRegister(member, lobbyId, isHosting));
    },
    onSaveTeamInfo: (teamInfo) => {
        dispatch(actions.peerSaveTeamInfo(teamInfo));
    },
    onSaveConnectionConfig: (connectionConfig) => {
        dispatch(actions.peerSaveConnectionConfig(connectionConfig));
    },
    onSaveConnectionLookup: (connectionLookup) => {
        dispatch(actions.peerSaveConnectionLookup(connectionLookup));
    },
});

const mergeProps = (stateProps, dispatchProps, ownProps) => ({
    ...stateProps,
    ...dispatchProps,
    ...ownProps,
    showReduxConnectionInfo: () => {
        console.log('stateProps.peerConnection', stateProps.peerConnection);
        console.log('dispatchProps.peerConnection', dispatchProps.peerConnection);
        console.log('ownProps.peerConnection', ownProps.peerConnection);
    },
});

export default connect(mapStateToProps, mapDispatchToProps, mergeProps)(Peer);
