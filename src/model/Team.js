/**
 * @typedef {object} Team
 * @property {string} id                only team1 and 2 for now
 * @property {string} teamColor         for lobby rendering
 * @property {Array<string>} memberIds  contains who is in the team
 */


export default class Team {
    constructor(
        id,
        teamColor,
        memberIds = [],
    ) {
        this.id = id;
        this.teamColor = teamColor;
        this.memberIds = memberIds;
    }
}
