import { connect } from 'react-redux';
import Peer from './Peer';

import actions from '../../actions';

const mapStateToProps = (state) => {
    return {};
};

const mapDispatchToProps = (dispatch) => ({
    onRegister: (member, lobbyId, isHosting, connectionConfig) => {
        dispatch(actions.peerOnRegister(member, lobbyId, isHosting, connectionConfig));
    },
    onSaveTeamInfo: (teamInfo) => {
        dispatch(actions.peerSaveTeamInfo(teamInfo));
    },
    onSaveConnectionLookup: (connectionLookup) => {
        dispatch(actions.peerSaveConnectionLookup(connectionLookup));
    },
    onAddMember: (member) => {
        dispatch(actions.addLobbyMember(member));
    },
    onRemoveMember: (memberId) => {
        dispatch(actions.removeLobbyMember(memberId));
    },
});

const mergeProps = (stateProps, dispatchProps, ownProps) => ({
    ...stateProps,
    ...dispatchProps,
    ...ownProps,
    showReduxConnectionInfo: () => {
        console.log('stateProps', stateProps);
        console.log('dispatchProps', dispatchProps);
        console.log('ownProps', ownProps);
    },
});

export default connect(mapStateToProps, mapDispatchToProps, mergeProps)(Peer);
