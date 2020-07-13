import React from 'react';
import PropTypes from 'prop-types';
import * as R from 'ramda';
import Member from '../../model/Member';
import Team from '../../model/Team';

import styles from './index.less';

class Lobby extends React.PureComponent {
    static propTypes = {
        teamIds: PropTypes.arrayOf(PropTypes.string),
        lobbyMemberIds: PropTypes.arrayOf(PropTypes.string),
        teamLookup: PropTypes.objectOf(Team.PropType),
        memberLookup: PropTypes.objectOf(Member.PropType),

        myId: PropTypes.string.isRequired,
        maxMember: PropTypes.number.isRequired,

        onReadyButtonClick: PropTypes.func.isRequired,
    }

    static defaultProps = {
        maxMember: 4,
    }

    constructor(props) {
        super(props);

        this.state = {};
    }

    _handleReadyButtonClick = (event) => {
        this.props.onReadyButtonClick(event);
    }

    _renderEmptyRow = (member) => {
        const rowStyle = { backgroundColor: '#eeeeee', justifyContent: 'center' };

        return (
            <div className={styles.lobbyRow} style={rowStyle}>
                <div>
                    { member.displayName }
                </div>
            </div>
        );
    }

    _renderRow = (member) => {
        const { teamIds, teamLookup, myId } = this.props;
        const teamInfoList = teamIds.map((id) => (teamLookup[id]));

        console.log('teamInfoList', teamInfoList);
        console.log('member.id', member.id);

        const checkMemberIdInTeam = (teamInfo) => R.includes(member.id, R.prop('memberIds', teamInfo));
        const targetTeamInfo = R.filter(checkMemberIdInTeam, teamInfoList)[0];
        const backgroundColor = R.propOr('#eeeeee', 'teamColor', targetTeamInfo);
        let rowStyle = { backgroundColor };

        if (member.isPlaceholder) {
            return this._renderEmptyRow(member);
        }

        return (
            <div className={styles.lobbyRow} style={rowStyle}>
                <div className={styles.nameCol}>
                    { member.displayName }
                </div>
                <div className={styles.readyCol}>
                    { member.isReady ? 'Ready' : 'Not Ready' }
                </div>
                {
                    myId === member.id ? (
                        <div className={styles.readyButtonCol}>
                            <button
                                className={styles.readyButton}
                                onClick={this._handleReadyButtonClick}
                            >
                                Ready
                            </button>
                        </div>
                    ) : (
                        <div className={styles.readyButtonCol} />
                    )
                }
            </div>
        );
    }

    _fillMembers = (lobbyMembers) => {
        const { maxMember } = this.props;

        const length = lobbyMembers.length;
        const fakeEmptyMember = {
            displayName: '--- Waiting ---',
            isPlaceholder: true,
        };
        const filledMembers = new Array(maxMember - length).fill().map(() => (fakeEmptyMember));

        return [ ...lobbyMembers, ...filledMembers ];
    }

    render() {
        const { lobbyMemberIds, memberLookup } = this.props;
        const lobbyMembers = lobbyMemberIds.map((id) => (memberLookup[id]));
        const lobbyRows = this._fillMembers(lobbyMembers).map(this._renderRow);

        return (
            <div>
                {lobbyRows}
            </div>
        );
    }
}

export default Lobby;
