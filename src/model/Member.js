/**
 * @typedef {object} Member
 * @property {string} id             member id for peerjs connection
 * @property {string} displayName    display name
 * @property {bool} isReady          is ready to start game
 */

export default class Member {
    constructor(
        id,
        displayName,
        isReady,
    ) {
        this.id = id;
        this.displayName = displayName;
        this.isReady = isReady;
    }
}
