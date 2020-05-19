import React from 'react';
import PropTypes from 'prop-types';
import * as R from 'ramda';

import styles from './index.less';

class Lobby extends React.PureComponent {
    static propTypes = {
        teamInfoList: PropTypes.arrayOf(PropTypes.shape({
            id: PropTypes.string.isRequired,
            memberIds: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
            teamColor: PropTypes.string.isRequired,
        })),
        lobbyMembers: PropTypes.arrayOf(PropTypes.shape({
            id: PropTypes.string.isRequired,
            displayName: PropTypes.string.isRequired,
            isReady: PropTypes.bool.isRequired,
        })),

        maxMember: PropTypes.number.isRequired,
    }

    static defaultProps = {
        maxMember: 4,
    }

    constructor(props) {
        super(props);

        this.state = {};
    }

    _renderRow = (member, additionalRowStyle) => {
        const { teamInfoList } = this.props;

        console.log('teamInfoList', teamInfoList);
        console.log('member.id', member.id);

        const checkMemberIdInTeam = (teamInfo) => R.includes(member.id, R.prop('memberIds', teamInfo));
        const targetTeamInfo = R.filter(checkMemberIdInTeam, teamInfoList)[0];
        const backgroundColor = R.propOr('#eeeeee', 'teamColor', targetTeamInfo);
        let rowStyle = { backgroundColor };

        if (member.isPlaceholder) {
            rowStyle.justifyContent = 'center';
        }

        return (
            <div className={styles.lobbyRow} style={rowStyle}>
                <div>
                    { member.displayName }
                </div>
                <div>
                    { member.isReady ? 'Ready' : '' }
                </div>
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
        const { lobbyMembers } = this.props;

        const lobbyRows = this._fillMembers(lobbyMembers).map(this._renderRow);

        return (
            <div>
                {lobbyRows}
            </div>
        );
    }
}

export default Lobby;
