import { connect } from 'react-redux';
import Peer from './Peer';

import actions from '../../actions';

const mapStateToProps = null;

const mapDispatchToProps = (dispatch) => ({
    peerSaveMyId: (id) => {
        dispatch(actions.peerSaveMyId(id));
    },
    peerSaveLeaderId: (id) => {
        dispatch(actions.peerSaveLeaderId(id));
    },
    peerSaveTeammateId: (id) => {
        dispatch(actions.peerSaveTeammateId(id));
    },
    peerSaveOpponentLeaderId: (id) => {
        dispatch(actions.peerSaveOpponentLeaderId(id));
    },
    peerSaveOpponentTeammateId: (id) => {
        dispatch(actions.peerSaveOpponentTeammateId(id));
    },
});

export default connect(mapStateToProps, mapDispatchToProps)(Peer);
